// scraper.js
const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeShopeeProduct(url) {
    try {
        console.log(`Iniciando scraping para: ${url}`);
        // Cabeçalho User-Agent para simular um navegador comum
        const headers = { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36', // User agent mais recente
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
            // Pode ser necessário adicionar mais cabeçalhos se a Shopee for exigente (Referer, Cookie, etc.)
        };

        const { data: html } = await axios.get(url, { headers });
        const $ = cheerio.load(html);
        console.log("Página carregada, iniciando extração...");

        // === IMPORTANTE: Seletores CSS precisam ser validados e ajustados ===
        // A estrutura da Shopee muda. Use as Ferramentas do Desenvolvedor (F12) 
        // no navegador para encontrar os seletores corretos ATUALMENTE.
        
        // Título: Tenta meta tag 'og:title', depois o H1 principal (inspecionar classe exata)
        const tituloOriginal = $('meta[property="og:title"]').attr('content')?.trim() || $('h1[class*="product-title"]').first().text()?.trim() || $('div[class*="page-product__header__title"] > span').first().text()?.trim();

        // Descrição: Tenta meta tag 'og:description', depois divs comuns para descrição
        const descricaoOriginal = $('meta[property="og:description"]').attr('content')?.trim() || $('div[class*="product-description"] p').text()?.trim() || $('div[class*="product-detail"] > div:last-child').text()?.trim(); // Pode precisar juntar múltiplos <p>

        // Preço: Estrutura complexa. Tentar encontrar o elemento principal do preço.
        const precoOriginal = $('div[class*="_prD-'"] > div').first().text()?.trim() || $('div[class*="flex items-center"] > div[class*="text-orange"]')?.first().text()?.trim(); // Classes podem variar muito

        // Categoria: Geralmente nos breadcrumbs
        let categoriaOriginal = "";
        $('div[class*="breadcrumb"] a, div[class*="breadcrumb"] span').each((i, el) => { // Pega links e spans
            const text = $(el).text()?.trim();
            if (text && text.toLowerCase() !== 'shopee') { // Ignora o link inicial "Shopee"
                 categoriaOriginal += (categoriaOriginal ? " > " : "") + text;
            }
        });

        // Avaliação Média: Procurar elemento com a pontuação
        const avaliacaoMediaOriginalText = $('div[class*="shopee-product-rating"] div[class*="rating-score"]').first().text()?.trim();
        const avaliacaoMediaOriginal = avaliacaoMediaOriginalText ? `${avaliacaoMediaOriginalText} Estrelas` : "Não encontrada";

        // Quantidade de Avaliações: Procurar elemento com o número total
        const quantidadeAvaliacoesOriginalText = $('div[class*="shopee-product-rating"] div[class*="rating-count"]').first().text()?.trim() || $('div:contains("avaliaç")').last().text()?.trim(); // Tenta encontrar texto com "avaliaç"
        const quantidadeAvaliacoesOriginal = quantidadeAvaliacoesOriginalText ? `${quantidadeAvaliacoesOriginalText} Avaliações` : "Não encontrada";

        // Nome da Loja: Procurar link ou div com nome da loja
        const nomeLojaOriginal = $('a[class*="shop-name"]').text()?.trim() || $('div[class*="shop-name"]').text()?.trim() || $('div[class*="section-seller-info__shop-name"] a').text()?.trim();

        // Variações: Mapear botões ou elementos de variação
        const variacoesOriginais = [];
        $('button[class*="product-variation"]').each((i, el) => {
            const text = $(el).text()?.trim();
            if (text) variacoesOriginais.push(text);
        });
         if (variacoesOriginais.length === 0) {
             $('div[class*="product-variation-group"] span[class*="product-variation__name"]').each((i,el) => {
                 const text = $(el).text()?.trim();
                 if (text) variacoesOriginais.push(text);
             });
         }
        // =====================================================================

        console.log("Extração concluída (verificar precisão dos dados).");

        // Retorna um objeto com os dados encontrados (ou um valor padrão)
        return {
            tituloOriginal: tituloOriginal || "Título não encontrado",
            descricaoOriginal: descricaoOriginal || "Descrição não encontrada",
            precoOriginal: precoOriginal || "Preço não encontrado",
            categoriaOriginal: categoriaOriginal || "Categoria não encontrada",
            avaliacaoMediaOriginal: avaliacaoMediaOriginal,
            quantidadeAvaliacoesOriginal: quantidadeAvaliacoesOriginal,
            nomeLojaOriginal: nomeLojaOriginal || "Loja não encontrada",
            variacoesOriginais: variacoesOriginais.length > 0 ? variacoesOriginais : ["Variações não encontradas"]
            // Adicionar mais campos aqui conforme necessário (ex: URLs de imagens, especificações)
        };

    } catch (error) {
        console.error(`Erro durante o scraping de ${url}:`, error.message);
        // Lança o erro para ser tratado no server.js
        // Adiciona mais contexto ao erro
        if (error.response) {
            console.error("Status do erro HTTP:", error.response.status);
            console.error("Headers do erro HTTP:", error.response.headers);
        }
        throw new Error(`Falha ao fazer scraping da URL (${error.message}). Verifique se o link está correto e acessível.`);
    }
}

// Exporta a função para ser usada no server.js
module.exports = { scrapeShopeeProduct };
