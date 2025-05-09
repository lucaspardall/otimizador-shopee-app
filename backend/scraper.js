// scraper.js - Versão com Puppeteer para renderizar JavaScript
const puppeteer = require('puppeteer');

// Diagnóstico do Chrome - Adicionado para verificar instalação
try {
    console.log('[Diagnóstico Chrome] Iniciando verificação do Chrome...');
    const browserFetcher = puppeteer.createBrowserFetcher();
    console.log('[Diagnóstico Chrome] Diretório do cache:', browserFetcher.cachePath);
    console.log('[Diagnóstico Chrome] PUPPETEER_EXECUTABLE_PATH:', process.env.PUPPETEER_EXECUTABLE_PATH || 'não definido');
    
    // Tenta listar as versões do Chrome disponíveis
    browserFetcher.localRevisions().then(revisions => {
        console.log('[Diagnóstico Chrome] Revisões locais disponíveis:', revisions);
    }).catch(e => {
        console.error('[Diagnóstico Chrome] Erro ao listar revisões:', e.message);
    });
} catch (e) {
    console.error('[Diagnóstico Chrome] Erro ao verificar Chrome:', e.message);
}

// Função auxiliar para rolar a página e carregar conteúdo dinâmico
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100; // Distância de cada scroll
            const scrollDelay = 100; // Pequeno delay entre scrolls
            const maxScrolls = 50; // Limite máximo de scrolls para evitar loops infinitos
            let scrolls = 0;
            let previousHeight = 0; // Para detetar se a rolagem parou de carregar novo conteúdo

            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                scrolls++;

                // Parar se o final da página for alcançado, ou se muitos scrolls foram feitos,
                // ou se a altura não mudar mais (indicando que todo conteúdo carregou)
                if (totalHeight >= scrollHeight - window.innerHeight || scrolls >= maxScrolls || previousHeight === scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
                previousHeight = scrollHeight;
            }, scrollDelay);
        });
    });
}

async function scrapeShopeeProduct(url) {
    let browser = null;
    console.log(`[Scraper Puppeteer] Iniciando para: ${url}`);
    try {
        console.log(`[Scraper Puppeteer] Tentando iniciar o browser...`);
        
        // Opções para o Render.com e ambientes com recursos limitados
        const launchOptions = {
            headless: true, // 'new' para o novo modo headless, true para o antigo. true é mais compatível.
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', // Importante para ambientes como Docker/Render
                '--disable-accelerated-2d-canvas',
                '--disable-gpu', // Útil em ambientes sem GPU
                '--window-size=1366,768', // Define um tamanho de janela
                '--single-process', // Pode ajudar em ambientes com pouca memória
                '--no-zygote' // Pode ajudar em ambientes com pouca memória
            ]
        };
        
        // Usa o caminho do executável do Chrome se fornecido pelo ambiente
        if (process.env.PUPPETEER_EXECUTABLE_PATH) {
            console.log(`[Scraper Puppeteer] Usando PUPPETEER_EXECUTABLE_PATH: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
            launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        }

        console.log("[Scraper Puppeteer] Iniciando browser com opções:", JSON.stringify(launchOptions, null, 2));
        browser = await puppeteer.launch(launchOptions);
        console.log(`[Scraper Puppeteer] Browser iniciado.`);

        const page = await browser.newPage();
        console.log(`[Scraper Puppeteer] Nova página criada.`);

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'); // User agent mais recente
        await page.setViewport({ width: 1366, height: 768 });

        // Configuração extra para tentar evitar detecção (stealth)
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt', 'en-US', 'en'] }); // Adiciona mais idiomas
            Object.defineProperty(navigator, 'plugins', {
                 get: () => [
                    { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer", description: "Portable Document Format" },
                    { name: "Chrome PDF Viewer", filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai", description: "" },
                    { name: "Native Client", filename: "internal-nacl-plugin", description: "" }
                 ]
            });
            // Simula consistência de plataforma
             Object.defineProperty(navigator, 'platform', { get: () => 'Win32' }); // Ou 'MacIntel', 'Linux x86_64'
        });
        
        // Intercepta requisições de imagem, css e fontes para acelerar o carregamento e reduzir uso de dados
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // Aumenta o timeout de navegação padrão
        page.setDefaultNavigationTimeout(90000); // 90 segundos

        console.log(`[Scraper Puppeteer] Navegando para ${url}...`);
        await page.goto(url, {
            waitUntil: 'networkidle0', // Espera até que não haja mais de 0 conexões de rede por 500ms
            timeout: 60000 // Timeout específico para page.goto (60 segundos)
        });
        console.log('[Scraper Puppeteer] Página principal carregada.');

        // Rola a página para baixo para tentar carregar conteúdo dinâmico
        console.log('[Scraper Puppeteer] Rolando a página...');
        await autoScroll(page);
        console.log('[Scraper Puppeteer] Rolagem concluída. Aguardando um pouco mais...');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Espera adicional para garantir que tudo carregou

        // Tenta salvar screenshot para debug (pode não funcionar em todos os ambientes)
        try {
            const screenshotPath = '/tmp/shopee-debug.png'; 
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`[Scraper Puppeteer] Screenshot salvo em ${screenshotPath}.`);
        } catch (ssError) {
            console.error(`[Scraper Puppeteer] Erro ao salvar screenshot: ${ssError.message}`);
        }

        console.log('[Scraper Puppeteer] Extraindo dados...');
        // Executa código JavaScript no contexto da página para extrair os dados
        const dadosExtraidos = await page.evaluate(() => {
            // Função auxiliar para tentar diferentes seletores e obter texto
            const getText = (selectors, attribute = null) => {
                for (const selector of selectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        if (attribute) {
                            return element.getAttribute(attribute)?.trim() || null;
                        }
                        return element.innerText?.trim() || null;
                    }
                }
                return null;
            };
            
            // Função auxiliar para obter todos os textos de múltiplos elementos
            const getAllText = (selectors, attribute = null) => {
                let results = [];
                for (const selector of selectors) {
                    const elements = document.querySelectorAll(selector);
                    if (elements && elements.length > 0) {
                        elements.forEach(el => {
                            const text = attribute ? el.getAttribute(attribute)?.trim() : el.innerText?.trim();
                            if (text) results.push(text);
                        });
                        if (results.length > 0) break; // Se encontrou com um seletor, para
                    }
                }
                return results;
            };
            
            // Seletores (estes são os que precisam de ajuste fino contínuo)
            const titulo = getText(['h1.vR6K3w', 'meta[property="og:title"]', 'div.WBVL_7 > h1', '.qaNIZv > span', '.product-title', '.product-name', '.product-detail__name', '.pdp-mod-product-title', 'h1'], 
                                   'meta[property="og:title"]' === 'meta[property="og:title"]' ? 'content' : null);
            
            let descricao = "";
            document.querySelectorAll('section.I_DV_3:has(h2.WjNdTR:contains("Descrição do produto")) div.e8lZp3 p.QN2lPu, div.product-description p, div.page-product__content__description > div > div, ._2jz573, .f7AU53, [data-testid="product-description"]').forEach(p => {
                const text = p.innerText?.trim();
                if (text) descricao += text + "\n";
            });
            descricao = descricao.trim() || getText(['meta[property="og:description"]'], 'content');

            const preco = getText(['div.IZPeQz.B67UQ0', 'div._3_ISdg', 'div.flex.items-center div.G27FPf', '.price', '.product-price', '.product-detail__price', '.pdp-price', '._2Shl1j', '.pqTWkA', '.XxUO7S']); 

            let categoria = "";
            document.querySelectorAll('div.page-product_breadcrumb a.EtYbJs, div.flex.items-center.RB266L a, div.ybxj32 div.idLK2l a.EtYbJs.R7vGdX, .breadcrumb a, .KOuwVw a, .shopee-breadcrumb a').forEach(a => {
                const text = a.innerText?.trim();
                if (text && text.toLowerCase() !== 'shopee') {
                    categoria += (categoria ? " > " : "") + text;
                }
            });
            
            const avaliacaoMedia = getText(['div.flex.asFzUa button.flex.e2p50f div.F9RHbS.dQEiAI.jMXp4d', 'span.product-rating-overview__rating-score', 'div.OitLRu', '.shopee-product-rating__rating-score', '.rating', '.product-rating', '.pdp-review-summary__rating']);
            
            let quantidadeAvaliacoes = null;
            const qtdAvaliacoesElement = document.querySelector('div.flex.asFzUa button.flex.e2p50f div.x1i_He:contains("Avaliações")');
            if (qtdAvaliacoesElement && qtdAvaliacoesElement.previousElementSibling) {
                 quantidadeAvaliacoes = qtdAvaliacoesElement.previousElementSibling.innerText?.trim();
            } else {
                 quantidadeAvaliacoes = getText(['div.product-rating-overview__filters div.product-rating-overview__filter--active', '.shopee-product-rating__total-rating', '.reviews-count', '.rating-review-count'])?.match(/\(([\d.,kKmM]+)\)/)?.[1];
            }
            
            const nomeLoja = getText(['div.r74CsV div.PYEGyz div.fV3TIn', 'div._3LybD1', 'a.shop-name', '.shop-name', '.seller-name', '.pdp-shop__name']);

            const variacoes = getAllText(['div.flex.items-center.j7HL5Q button.sApkZm', 'button.product-variation', '.variation-item', '[data-testid="product-variation"]'], 'aria-label');

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
        if (browser) {
            console.log(`[Scraper Puppeteer] Fechando browser...`);
            await browser.close();
            console.log(`[Scraper Puppeteer] Browser fechado.`);
        }
    }
}

module.exports = { scrapeShopeeProduct };
