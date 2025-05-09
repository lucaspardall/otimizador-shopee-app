    // scraper.js - VERSÃO MOCK TOTAL PARA TESTE
    // Esta versão NÃO usa axios nem cheerio. Apenas retorna dados fixos.

    async function scrapeShopeeProduct(url) {
        console.log(`[Scraper - MOCK TOTAL] Recebeu URL: ${url}`);
        console.log("[Scraper - MOCK TOTAL] Devolvendo dados de exemplo fixos...");

        // Estes são os dados que o server.js espera que o scraper retorne
        return {
            tituloOriginal: "Título (Scraper MOCK)",
            descricaoOriginal: "Descrição (Scraper MOCK)",
            precoOriginal: "R$ 10,00 (Scraper MOCK)",
            categoriaOriginal: "Categoria (Scraper MOCK)",
            avaliacaoMediaOriginal: "5 Estrelas (Scraper MOCK)",
            quantidadeAvaliacoesOriginal: "100 Avaliações (Scraper MOCK)",
            nomeLojaOriginal: "Loja (Scraper MOCK)",
            variacoesOriginais: ["Var1 (MOCK)", "Var2 (MOCK)"]
        };
    }

    module.exports = { scrapeShopeeProduct };
    
