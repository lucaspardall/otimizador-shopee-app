// scraper.js - Versão com ScraperAPI
const axios = require('axios');
const cheerio = require('cheerio');

// Sua chave de API do ScraperAPI
const API_KEY = '1a88769b0247472aefd034cce71ca771';

async function scrapeShopeeProduct(url) {
    console.log(`[ScraperAPI] Iniciando raspagem para: ${url}`);
    try {
        // Faz a requisição para a API de scraping
        const response = await axios.get('https://api.scraperapi.com/scrape', {
            params: {
                api_key: API_KEY,
                url: url,
                render: true,
                country_code: 'br'
            },
            timeout: 60000 // 60 segundos de timeout
        });

        console.log('[ScraperAPI] Resposta recebida com sucesso');
        
        // Carrega o HTML recebido no Cheerio para extrair dados
        const $ = cheerio.load(response.data);
        
        // Extração do título
        const titulo = $('h1.vR6K3w, h1.pdp-mod-product-name, .qaNIZv > span, .product-title').first().text().trim() || 
                      $('meta[property="og:title"]').attr('content') || 
                      "Título não encontrado";
        
        // Extração da descrição
        let descricao = "";
        $('section.I_DV_3:has(h2.WjNdTR:contains("Descrição do produto")) div.e8lZp3 p.QN2lPu, div.product-description p, div.page-product__content__description > div > div, ._2jz573, .f7AU53, [data-testid="product-description"]').each((i, el) => {
            const text = $(el).text().trim();
            if (text) descricao += text + "\n";
        });
        descricao = descricao.trim() || $('meta[property="og:description"]').attr('content') || "Descrição não encontrada";
        
        // Extração do preço
        const preco = $('div.IZPeQz.B67UQ0, div._3_ISdg, div.flex.items-center div.G27FPf, .price, .product-price, .product-detail__price, .pdp-price, ._2Shl1j, .pqTWkA, .XxUO7S').first().text().trim() || 
                     "Preço não encontrado";
        
        // Extração da categoria
        let categoria = "";
        $('div.page-product_breadcrumb a.EtYbJs, div.flex.items-center.RB266L a, div.ybxj32 div.idLK2l a.EtYbJs.R7vGdX, .breadcrumb a, .KOuwVw a, .shopee-breadcrumb a').each((i, el) => {
            const text = $(el).text().trim();
            if (text && text.toLowerCase() !== 'shopee') {
                categoria += (categoria ? " > " : "") + text;
            }
        });
        categoria = categoria || "Categoria não encontrada";
        
        // Extração da avaliação média
        const avaliacaoMedia = $('div.flex.asFzUa button.flex.e2p50f div.F9RHbS.dQEiAI.jMXp4d, span.product-rating-overview__rating-score, div.OitLRu, .shopee-product-rating__rating-score, .rating, .product-rating, .pdp-review-summary__rating').first().text().trim() || 
                             "Avaliação não encontrada";
        
        // Extração da quantidade de avaliações
        let quantidadeAvaliacoes = "";
        const avalText = $('div.flex.asFzUa button.flex.e2p50f div.x1i_He:contains("Avaliações")').prev().text().trim() ||
                       $('div.product-rating-overview__filters div.product-rating-overview__filter--active, .shopee-product-rating__total-rating, .reviews-count, .rating-review-count').first().text().trim();
        
        if (avalText) {
            const match = avalText.match(/\(([\d.,kKmM]+)\)/);
            quantidadeAvaliacoes = match ? match[1] : avalText;
        } else {
            quantidadeAvaliacoes = "Qtd. Avaliações não encontrada";
        }
        
        // Extração do nome da loja
        const nomeLoja = $('div.r74CsV div.PYEGyz div.fV3TIn, div._3LybD1, a.shop-name, .shop-name, .seller-name, .pdp-shop__name').first().text().trim() ||
                       "Loja não encontrada";
        
        // Extração das variações
        const variacoes = [];
        $('div.flex.items-center.j7HL5Q button.sApkZm, button.product-variation, .variation-item, [data-testid="product-variation"]').each((i, el) => {
            const text = $(el).attr('aria-label') || $(el).text().trim();
            if (text) variacoes.push(text);
        });
        
        const dadosExtraidos = {
            tituloOriginal: titulo,
            descricaoOriginal: descricao,
            precoOriginal: preco,
            categoriaOriginal: categoria,
            avaliacaoMediaOriginal: avaliacaoMedia.includes('Estrelas') ? avaliacaoMedia : `${avaliacaoMedia} Estrelas`,
            quantidadeAvaliacoesOriginal: quantidadeAvaliacoes.includes('Avaliações') ? quantidadeAvaliacoes : `${quantidadeAvaliacoes} Avaliações`,
            nomeLojaOriginal: nomeLoja,
            variacoesOriginais: variacoes.length > 0 ? variacoes : ["Variações não encontradas"]
        };

        console.log(`[ScraperAPI] Dados extraídos com sucesso. Título: ${dadosExtraidos.tituloOriginal}`);
        return dadosExtraidos;

    } catch (error) {
        console.error(`[ScraperAPI] ERRO durante a raspagem: ${error.message}`, error.stack);
        return {
            tituloOriginal: "Erro no Scraper (API)",
            descricaoOriginal: `Falha ao extrair dados: ${error.message}`,
            precoOriginal: "Erro",
            categoriaOriginal: "Erro",
            avaliacaoMediaOriginal: "Erro",
            quantidadeAvaliacoesOriginal: "Erro",
            nomeLojaOriginal: "Erro",
            variacoesOriginais: ["Erro"]
        };
    }
}

module.exports = { scrapeShopeeProduct };
