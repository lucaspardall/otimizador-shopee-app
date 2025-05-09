// scraper.js - AJUSTAR SELETORES CSS
const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeShopeeProduct(url) {
    try {
        console.log(`[Scraper] Iniciando scraping para: ${url}`);
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
        };

        const { data: html } = await axios.get(url, { headers });
        const $ = cheerio.load(html);
        console.log("[Scraper] Página carregada, iniciando extração...");

        // =====================================================================
        // == PONTO CRÍTICO: AJUSTAR OS SELETORES CSS ABAIXO ==
        // == Use as Ferramentas do Desenvolvedor (F12) na página da Shopee ==
        // == para encontrar os seletores corretos para CADA campo.        ==
        // =====================================================================

        // --- Título ---
        // Procure a tag (h1, div, span?) e classe(s) do título principal
        const tituloOriginal = $('SELETOR_CSS_DO_TITULO_AQUI').first().text()?.trim() 
                            || $('meta[property="og:title"]').attr('content')?.trim(); // Fallback para meta tag

        // --- Descrição ---
        // Procure a div ou parágrafos que contêm a descrição completa
        const descricaoOriginal = $('SELETOR_CSS_DA_DESCRICAO_AQUI').text()?.trim()
                               || $('meta[property="og:description"]').attr('content')?.trim(); // Fallback

        // --- Preço ---
        // Encontrar o elemento que mostra o preço (pode ter variações)
        const precoOriginal = $('SELETOR_CSS_DO_PRECO_AQUI').first().text()?.trim();

        // --- Categoria ---
        // Geralmente nos breadcrumbs (ex: div.breadcrumb > a)
        let categoriaOriginal = "";
        $('SELETOR_CSS_DOS_BREADCRUMBS_AQUI').each((i, el) => {
            const text = $(el).text()?.trim();
            if (text && text.toLowerCase() !== 'shopee') {
                 categoriaOriginal += (categoriaOriginal ? " > " : "") + text;
            }
        });

        // --- Avaliação Média ---
        // Encontrar o elemento com a pontuação (ex: 4.8)
        const avaliacaoMediaOriginalText = $('SELETOR_CSS_DA_PONTUACAO_AQUI').first().text()?.trim();
        const avaliacaoMediaOriginal = avaliacaoMediaOriginalText ? `${avaliacaoMediaOriginalText} Estrelas` : "Não encontrada";

        // --- Quantidade de Avaliações ---
        // Encontrar o elemento com o número total de avaliações
        const quantidadeAvaliacoesOriginalText = $('SELETOR_CSS_DA_QTD_AVALIACOES_AQUI').first().text()?.trim();
        const quantidadeAvaliacoesOriginal = quantidadeAvaliacoesOriginalText ? `${quantidadeAvaliacoesOriginalText} Avaliações` : "Não encontrada";

        // --- Nome da Loja ---
        // Encontrar o link ou div com o nome da loja
        const nomeLojaOriginal = $('SELETOR_CSS_DO_NOME_DA_LOJA_AQUI').text()?.trim();

        // --- Variações ---
        // Encontrar os botões ou spans das variações
        const variacoesOriginais = [];
        $('SELETOR_CSS_DAS_VARIACOES_AQUI').each((i, el) => {
            const text = $(el).text()?.trim();
            if (text) variacoesOriginais.push(text);
        });
        // =====================================================================

        console.log("[Scraper] Extração concluída (verificar precisão dos dados).");

        // Retorna um objeto com os dados encontrados
        const dadosExtraidos = {
            tituloOriginal: tituloOriginal || "Título não encontrado",
            descricaoOriginal: descricaoOriginal || "Descrição não encontrada",
            precoOriginal: precoOriginal || "Preço não encontrado",
            categoriaOriginal: categoriaOriginal || "Categoria não encontrada",
            avaliacaoMediaOriginal: avaliacaoMediaOriginal,
            quantidadeAvaliacoesOriginal: quantidadeAvaliacoesOriginal,
            nomeLojaOriginal: nomeLojaOriginal || "Loja não encontrada",
            variacoesOriginais: variacoesOriginais.length > 0 ? variacoesOriginais : ["Variações não encontradas"]
            // Adicionar mais campos se necessário
        };

        // Log para verificar os dados extraídos (antes de retornar)
        console.log("[Scraper] Dados extraídos:", JSON.stringify(dadosExtraidos, null, 2));

        // Verifica se pelo menos o título ou descrição foram encontrados
        if (dadosExtraidos.tituloOriginal === "Título não encontrado" && dadosExtraidos.descricaoOriginal === "Descrição não encontrada") {
             console.warn("[Scraper] Não foi possível extrair título nem descrição. Provavelmente os seletores estão incorretos ou a página mudou.");
             // Pode optar por lançar um erro aqui se título/descrição forem essenciais
             // throw new Error("Não foi possível extrair informações essenciais do produto.");
        }


        return dadosExtraidos;

    } catch (error) {
        console.error(`[Scraper] Erro durante o scraping de ${url}:`, error.message);
        if (error.response) {
            console.error("[Scraper] Status do erro HTTP:", error.response.status);
            // Se for erro 4xx ou 5xx da Shopee, pode indicar bloqueio ou página não encontrada
            if (error.response.status >= 400) {
                 throw new Error(`Falha ao acessar a página do produto (Status ${error.response.status}). Verifique o link ou a Shopee pode ter bloqueado o acesso.`);
            }
        }
        // Lança um erro genérico para ser tratado no server.js
        throw new Error(`Falha ao fazer scraping da URL: ${error.message}`);
    }
}

module.exports = { scrapeShopeeProduct };
