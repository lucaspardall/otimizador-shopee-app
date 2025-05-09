    // scraper.js - Tentando Scraping Real do Título
    const axios = require('axios');
    const cheerio = require('cheerio');

    async function scrapeShopeeProduct(url) {
        try {
            console.log(`[Scraper] Iniciando scraping REAL para: ${url}`);
            const headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                // Adicionar mais cabeçalhos pode ser necessário se a Shopee bloquear
            };

            const { data: html } = await axios.get(url, { headers });
            const $ = cheerio.load(html);
            console.log("[Scraper] Página carregada, iniciando extração do título...");

            // --- Título ---
            // Seletor atualizado com base na sua informação: h1 com classe vR6K3w
            const tituloOriginal = $('h1.vR6K3w').first().text()?.trim() 
                                || $('meta[property="og:title"]').attr('content')?.trim(); 

            console.log("[Scraper] Extração do título concluída. Título encontrado:", tituloOriginal); // Log para ver o título

            const dadosExtraidos = {
                tituloOriginal: tituloOriginal || "Título não encontrado pelo scraper",
                descricaoOriginal: "Descrição (AINDA MOCK)", // Mantém mock para outros campos
                precoOriginal: "Preço (AINDA MOCK)",
                categoriaOriginal: "Categoria (AINDA MOCK)",
                avaliacaoMediaOriginal: "Avaliação (AINDA MOCK)",
                quantidadeAvaliacoesOriginal: "Qtd Avaliações (AINDA MOCK)",
                nomeLojaOriginal: "Loja (AINDA MOCK)",
                variacoesOriginais: ["Variação (AINDA MOCK)"]
            };

            console.log("[Scraper] Dados para enviar ao aiService:", JSON.stringify(dadosExtraidos, null, 2));
            return dadosExtraidos;

        } catch (error) {
            console.error(`[Scraper] ERRO durante o scraping de ${url}:`, error.message);
            // Retorna um objeto com erro para o server.js tratar
            // É importante que o objeto retornado tenha a mesma estrutura esperada, mesmo em caso de erro no scraping
            return {
                tituloOriginal: "Erro no Scraper",
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
    
