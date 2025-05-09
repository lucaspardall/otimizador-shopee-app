// scraper.js - Versão compatível com Render usando chrome-aws-lambda
const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

// Função auxiliar para rolar a página e carregar conteúdo dinâmico
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const scrollDelay = 100;
            const maxScrolls = 50;
            let scrolls = 0;
            let previousHeight = 0;

            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                scrolls++;

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
    console.log(`[Scraper chrome-aws-lambda] Iniciando para: ${url}`);
    try {
        console.log(`[Scraper chrome-aws-lambda] Configurando browser...`);
        
        // chrome-aws-lambda gerencia o executável do Chrome e suas configurações
        const executablePath = await chromium.executablePath;
        console.log(`[Scraper chrome-aws-lambda] Caminho do executável: ${executablePath}`);
        
        const launchOptions = {
            executablePath,
            headless: chromium.headless,
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            ignoreHTTPSErrors: true,
        };
        
        console.log(`[Scraper chrome-aws-lambda] Lançando com opções: ${JSON.stringify(launchOptions, null, 2)}`);
        browser = await puppeteer.launch(launchOptions);
        console.log(`[Scraper chrome-aws-lambda] Browser iniciado com sucesso!`);

        const page = await browser.newPage();
        console.log(`[Scraper chrome-aws-lambda] Nova página criada.`);

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1366, height: 768 });

        // Configuração anti-detecção
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt', 'en-US', 'en'] });
            Object.defineProperty(navigator, 'plugins', { get: () => [
                { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer", description: "Portable Document Format" },
                { name: "Chrome PDF Viewer", filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai", description: "" },
                { name: "Native Client", filename: "internal-nacl-plugin", description: "" }
            ]});
            Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
        });
        
        // Bloqueio de recursos para melhorar a performance
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        page.setDefaultNavigationTimeout(90000);

        console.log(`[Scraper chrome-aws-lambda] Navegando para ${url}...`);
        await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 60000
        });
        console.log('[Scraper chrome-aws-lambda] Página principal carregada.');

        console.log('[Scraper chrome-aws-lambda] Rolando a página...');
        await autoScroll(page);
        console.log('[Scraper chrome-aws-lambda] Rolagem concluída. Aguardando...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log('[Scraper chrome-aws-lambda] Extraindo dados...');
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
            
            // Seletores para dados do produto
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

        console.log(`[Scraper chrome-aws-lambda] Dados extraídos com sucesso. Título: ${dadosExtraidos.tituloOriginal}`);
        return dadosExtraidos;

    } catch (error) {
        console.error(`[Scraper chrome-aws-lambda] ERRO durante o scraping: ${error.message}, Stack: ${error.stack}`);
        return {
            tituloOriginal: "Erro no Scraper (chrome-aws-lambda)",
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
            console.log(`[Scraper chrome-aws-lambda] Fechando browser...`);
            await browser.close();
            console.log(`[Scraper chrome-aws-lambda] Browser fechado.`);
        }
    }
}

module.exports = { scrapeShopeeProduct };
