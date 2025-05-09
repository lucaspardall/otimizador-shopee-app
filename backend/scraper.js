// scraper.js - Versão com Puppeteer para renderizar JavaScript
const puppeteer = require('puppeteer');

// Função auxiliar para rolar a página e carregar conteúdo dinâmico
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100; // Distância de cada scroll
            const scrollDelay = 100; // Pequeno delay entre scrolls
            const maxScrolls = 50; // Limite máximo de scrolls para evitar loops infinitos
            let scrolls = 0;

            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                scrolls++;

                // Parar se o final da página for alcançado, ou se muitos scrolls foram feitos,
                // ou se a altura não mudar mais (indicando que todo conteúdo carregou)
                if (totalHeight >= scrollHeight - window.innerHeight || scrolls >= maxScrolls) {
                    clearInterval(timer);
                    resolve();
                }
            }, scrollDelay);
        });
    });
}


async function scrapeShopeeProduct(url) {
    let browser = null;
    console.log(`[Scraper Puppeteer] Iniciando para: ${url}`);
    try {
        console.log(`[Scraper Puppeteer] Tentando iniciar o browser...`);
        browser = await puppeteer.launch({
            headless: true, // 'new' para o novo modo headless, true para o antigo. true é mais compatível em alguns ambientes.
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', // Importante para ambientes como Docker/Render
                '--disable-accelerated-2d-canvas',
                '--disable-gpu', // Útil em ambientes sem GPU
                '--window-size=1366,768' // Define um tamanho de janela
            ]
        });
        console.log(`[Scraper Puppeteer] Browser iniciado.`);

        const page = await browser.newPage();
        console.log(`[Scraper Puppeteer] Nova página criada.`);

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1366, height: 768 });

        // Configuração extra para tentar evitar detecção (stealth)
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt'] });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5].map(i => ({ name: `Plugin ${i}`, filename: `plugin${i}.dll` })) });
        });

        // Aumenta o timeout de navegação padrão
        page.setDefaultNavigationTimeout(60000); // 60 segundos

        console.log(`[Scraper Puppeteer] Navegando para ${url}...`);
        await page.goto(url, {
            waitUntil: 'networkidle2', // Espera até que a rede fique ociosa (bom para SPAs)
            timeout: 45000 // Timeout específico para page.goto
        });
        console.log('[Scraper Puppeteer] Página principal carregada.');

        // Rola a página para baixo para tentar carregar conteúdo dinâmico
        console.log('[Scraper Puppeteer] Rolando a página...');
        await autoScroll(page);
        console.log('[Scraper Puppeteer] Rolagem concluída. Aguardando um pouco mais...');
        await page.waitForTimeout(3000); // Espera adicional para garantir que tudo carregou

        // Debug - Salva screenshot para análise (Render salva em /tmp)
        const screenshotPath = '/tmp/shopee-debug.png';
        await page.screenshot({ path: screenshotPath });
        console.log(`[Scraper Puppeteer] Screenshot salvo em ${screenshotPath}. Verifique este arquivo nos logs do deploy se houver problemas.`);

        console.log('[Scraper Puppeteer] Extraindo dados...');
        const dadosExtraidos = await page.evaluate(() => {
            const getText = (selector, attribute = null) => {
                const element = document.querySelector(selector);
                if (!element) return null;
                if (attribute) return element.getAttribute(attribute)?.trim();
                return element.innerText?.trim();
            };

            const getAllText = (selector, attribute = null) => {
                const elements = document.querySelectorAll(selector);
                if (!elements || elements.length === 0) return [];
                return Array.from(elements).map(el => {
                    if (attribute) return el.getAttribute(attribute)?.trim();
                    return el.innerText?.trim();
                }).filter(text => text); // Remove vazios
            };
            
            // Seletores (podem precisar de ajuste fino contínuo)
            const titulo = getText('h1.vR6K3w') || getText('meta[property="og:title"]', 'content') || getText('div.WBVL_7 > h1');
            
            let descricao = "";
            document.querySelectorAll('section.I_DV_3:has(h2.WjNdTR:contains("Descrição do produto")) div.e8lZp3 p.QN2lPu').forEach(p => {
                const text = p.innerText?.trim();
                if (text) descricao += text + "\n";
            });
            descricao = descricao.trim() || getText('meta[property="og:description"]', 'content');

            const preco = getText('div.IZPeQz.B67UQ0') || getText('div._3_ISdg'); // Adicionado fallback para preço

            let categoria = "";
            document.querySelectorAll('div.page-product_breadcrumb a.EtYbJs, div.flex.items-center.RB266L a').forEach(a => {
                const text = a.innerText?.trim();
                if (text && text.toLowerCase() !== 'shopee') {
                    categoria += (categoria ? " > " : "") + text;
                }
            });
            
            const avaliacaoMedia = getText('div.flex.asFzUa button.flex.e2p50f div.F9RHbS.dQEiAI.jMXp4d') || getText('span.product-rating-overview__rating-score');
            
            const qtdAvaliacoesElement = document.querySelector('div.flex.asFzUa button.flex.e2p50f div.x1i_He:contains("Avaliações")');
            const quantidadeAvaliacoes = qtdAvaliacoesElement ? qtdAvaliacoesElement.previousElementSibling?.innerText?.trim() : null;
            
            const nomeLoja = getText('div.r74CsV div.PYEGyz div.fV3TIn') || getText('div._3LybD1');

            const variacoes = getAllText('div.flex.items-center.j7HL5Q button.sApkZm', 'aria-label');

            return {
                tituloOriginal: titulo || "Título não encontrado",
                descricaoOriginal: descricao || "Descrição não encontrada",
                precoOriginal: preco || "Preço não encontrado",
                categoriaOriginal: categoria || "Categoria não encontrada",
                avaliacaoMediaOriginal: avaliacaoMedia ? `${avaliacaoMedia} Estrelas` : "Avaliação não encontrada",
                quantidadeAvaliacoesOriginal: quantidadeAvaliacoes ? `${quantidadeAvaliacoes} Avaliações` : "Qtd. Avaliações não encontrada",
                nomeLojaOriginal: nomeLoja || "Loja não encontrada",
                variacoesOriginais: variacoes.length > 0 ? variacoes : ["Variações não encontradas"]
            };
        });

        console.log(`[Scraper Puppeteer] Dados extraídos com sucesso. Título: ${dadosExtraidos.tituloOriginal}`);
        return dadosExtraidos;

    } catch (error) {
        console.error(`[Scraper Puppeteer] ERRO durante o scraping de ${url}:`, error.message, error.stack);
        // Se ocorrer um erro, retorna um objeto com erro mas mantendo a estrutura esperada
        return {
            tituloOriginal: "Erro no Scraper (Puppeteer)",
            descricaoOriginal: `Falha ao extrair dados: ${error.message}`,
            precoOriginal: "Erro",
            categoriaOriginal: "Erro",
            avaliacaoMediaOriginal: "Erro",
            quantidadeAvaliacoesOriginal: "Erro",
            nomeLojaOriginal: "Erro",
            variacoesOriginais: ["Erro"]
        };
    } finally {
        // Garante que o browser seja fechado mesmo em caso de erro
        if (browser) {
            console.log(`[Scraper Puppeteer] Fechando browser...`);
            await browser.close();
            console.log(`[Scraper Puppeteer] Browser fechado.`);
        }
    }
}

module.exports = { scrapeShopeeProduct };
