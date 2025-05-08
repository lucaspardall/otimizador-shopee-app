// scraper.js
const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeShopeeProduct(url) {
    try {
        console.log(`Iniciando scraping para: ${url}`);
        const { data: html } = await axios.get(url, {
            headers: { // Alguns sites bloqueiam requisições sem um User-Agent de navegador
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const $ = cheerio.load(html);
        console.log("Página carregada, iniciando extração...");

        // **IMPORTANTE:** Os seletores CSS abaixo são EXEMPLOS e precisarão ser
        // inspecionados e ajustados para a estrutura ATUAL da página da Shopee.
        // Um desenvolvedor usaria as "Ferramentas do Desenvolvedor" do navegador (F12)
        // para encontrar os seletores corretos para cada informação.

        const tituloOriginal = $('meta[property="og:title"]').attr('content') || $('h1').first().text().trim(); // Tenta meta tag, senão primeiro H1
        const descricaoOriginal = $('meta[property="og:description"]').attr('content') || $('div[class*="product-description"]').text().trim(); // Tenta meta tag ou uma div com classe comum

        // Exemplo para preço (pode ser complexo devido a variações)
        // Este é um seletor genérico e provavelmente precisará de ajuste fino.
        const precoOriginal = $('div[class*="price"] > span').first().text().trim() || $('div[class*="flex items-center"] > div[class*="text-orange-500"]').first().text().trim();

        // Exemplo para categoria (pode ser uma sequência de links "breadcrumbs")
        let categoriaOriginal = "";
        $('a[class*="breadcrumb"]').each((i, el) => { // Exemplo de seletor para breadcrumbs
            categoriaOriginal += $(el).text().trim() + (i < $('a[class*="breadcrumb"]').length - 1 ? " > " : "");
        });
        if (!categoriaOriginal) { // Plano B se breadcrumbs não forem encontrados
             $('div[class*="product-category"]').find('a').each((i, el) => {
                categoriaOriginal += $(el).text().trim() + " ";
            });
            categoriaOriginal = categoriaOriginal.trim();
        }


        // Exemplo para avaliação (geralmente um número e texto "estrelas")
        const avaliacaoMediaOriginal = $('div[class*="shopee-product-rating__rating-score"]').text().trim() + " Estrelas";
        const quantidadeAvaliacoesOriginal = $('div[class*="shopee-product-rating__total-rating"]').first().text().trim() + " Avaliações";

        // Exemplo para nome da loja
        const nomeLojaOriginal = $('a[class*="shop-name"]').text().trim() || $('div[class*="shop-name"]').text().trim();

        // Exemplo para variações (pode ser muito complexo, aqui uma simplificação)
        const variacoesOriginais = [];
        $('button[class*="product-variation"]').each((i, el) => { // Se variações forem botões
            variacoesOriginais.push($(el).text().trim());
        });
        // Se não encontrar botões, pode tentar outras estruturas
        if (variacoesOriginais.length === 0) {
             $('div[class*="product-variation-group"] span[class*="product-variation__name"]').each((i,el) => {
                 variacoesOriginais.push($(el).text().trim());
             });
        }


        console.log("Extração concluída (parcialmente).");

        return {
            tituloOriginal: tituloOriginal || "Não encontrado",
            descricaoOriginal: descricaoOriginal || "Não encontrada",
            precoOriginal: precoOriginal || "Não encontrado",
            categoriaOriginal: categoriaOriginal || "Não encontrada",
            avaliacaoMediaOriginal: avaliacaoMediaOriginal.includes("Estrelas") ? avaliacaoMediaOriginal : "Não encontrada",
            quantidadeAvaliacoesOriginal: quantidadeAvaliacoesOriginal.includes("Avaliações") ? quantidadeAvaliacoesOriginal : "Não encontrada",
            nomeLojaOriginal: nomeLojaOriginal || "Não encontrado",
            variacoesOriginais: variacoesOriginais.length > 0 ? variacoesOriginais : ["Não encontradas"]
            // Adicionar mais campos conforme o "DOC ATUALIZADO"
        };

    } catch (error) {
        console.error(`Erro durante o scraping de ${url}:`, error.message);
        // É importante decidir como tratar o erro. Lançar o erro ou retornar um objeto de erro?
        // Lançar o erro pode ser melhor para o endpoint da API tratar.
        throw new Error(`Falha ao fazer scraping da URL: ${error.message}`);
    }
}

module.exports = { scrapeShopeeProduct }; // Exporta a função
