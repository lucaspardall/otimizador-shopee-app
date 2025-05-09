// scraper.js - Versão com Puppeteer e executablePath configurado
const puppeteer = require('puppeteer');

// Função auxiliar para rolar a página e carregar conteúdo dinâmico
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const scrollDelay = 100;
            const maxScrolls = 50;
            let scrolls = 0;
            let previousHeight = document.body.scrollHeight;

            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                scrolls++;
                if (totalHeight >= scrollHeight - window.innerHeight || scrolls >= maxScrolls || (previousHeight === scrollHeight && scrolls > 10) ) {
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
        console.log('[Scraper Puppeteer] Tentando iniciar o browser...');
        
        // Caminho onde o Chrome deve ser instalado pelo script de build no package.json
        // A versão 127.0.6533.88 foi mencionada no erro anterior.
        // O Render usa Linux, então o caminho interno para o executável é geralmente 'chrome' dentro da pasta 'chrome-linux'.
        const chromeExecutablePath = '/tmp/puppeteer-cache/chrome/linux-127.0.6533.88/chrome-linux/chrome';

        browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || chromeExecutablePath, // Usa variável de ambiente ou o caminho fixo
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1366,768',
                '--single-process',
                '--no-zygote'
            ]
        });
        console.log('[Scraper Puppeteer] Browser iniciado.');

        const page = await browser.newPage();
        console.log('[Scraper Puppeteer] Nova página criada.');

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1366, height: 768 });

        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt', 'en-US', 'en'] });
            Object.defineProperty(navigator, 'plugins', {
                 get: () => [
                    { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer", description: "Portable Document Format" },
                    { name: "Chrome PDF Viewer", filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai", description: "" },
                    { name: "Native Client", filename: "internal-nacl-plugin", description: "" }
                 ]
            });
             Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
        });
        
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        page.setDefaultNavigationTimeout(90000); 

        console.log(`[Scraper Puppeteer] Navegando para ${url}...`);
        await page.goto(url, {
            waitUntil: 'networkidle0', 
            timeout: 60000 
        });
        console.log('[Scraper Puppeteer] Página principal carregada.');

        console.log('[Scraper Puppeteer] Rolando a página...');
        await autoScroll(page);
        console.log('[Scraper Puppeteer] Rolagem concluída. Aguardando um pouco mais...');
        await new Promise(resolve => setTimeout(resolve, 5000)); 

        const screenshotPath = '/tmp/shopee-debug.png'; 
        try {
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`[Scraper Puppeteer] Screenshot salvo em ${screenshotPath}.`);
        } catch (ssError) {
            console.error(`[Scraper Puppeteer] Erro ao salvar screenshot: ${ssError.message}`);
        }

        console.log('[Scraper Puppeteer] Extraindo dados...');
        const dadosExtraidos = await page.evaluate(() => {
            const getText = (selectors, attribute = null) => { /* ... (função mantida) ... */ 
                for (const selector of selectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        if (attribute) return element.getAttribute(attribute)?.trim() || null;
                        return element.innerText?.trim() || null;
                    }
                }
                return null;
            };
            const getAllText = (selectors, attribute = null) => { /* ... (função mantida) ... */ 
                let results = [];
                for (const selector of selectors) {
                    const elements = document.querySelectorAll(selector);
                    if (elements && elements.length > 0) {
                        elements.forEach(el => {
                            const text = attribute ? el.getAttribute(attribute)?.trim() : el.innerText?.trim();
                            if (text) results.push(text);
                        });
                        if (results.length > 0) break; 
                    }
                }
                return results;
            };
            
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
