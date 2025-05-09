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
        // Exemplo: Procure por <div class="flex items-center R6VIpR"> <span class="WBVL_7"> TÍTULO AQUI </span> </div> -> Seletor: 'div.R6VIpR span.WBVL_7'
        const tituloOriginal = $('div.flex.items-center.R6VIpR span.WBVL_7').first().text()?.trim() // <- SUBSTITUA PELO SELETOR REAL
                            || $('meta[property="og:title"]').attr('content')?.trim(); 

        // --- Descrição ---
        // Exemplo: Procure por <p class="_3yvRG6"> <span> DESCRIÇÃO AQUI </span> </p> -> Seletor: 'p._3yvRG6 span'
        const descricaoOriginal = $('div.product-description p').text()?.trim() // <- SUBSTITUA PELO SELETOR REAL (pode precisar juntar vários elementos)
                               || $('meta[property="og:description"]').attr('content')?.trim(); 

        // --- Preço ---
        // Exemplo: <div class="flex items-center"> <div class="flex items-center"> <div class="G27FPf"> PREÇO AQUI </div> </div> </div> -> Seletor: 'div.G27FPf'
        const precoOriginal = $('div.G27FPf').first().text()?.trim(); // <- SUBSTITUA PELO SELETOR REAL

        // --- Categoria ---
        // Exemplo: <div class="flex items-center RB266L"> <a href="..."> CAT 1 </a> ... </div> -> Seletor: 'div.RB266L a'
        let categoriaOriginal = "";
        $('div.flex.items-center.RB266L a').each((i, el) => { // <- SUBSTITUA PELO SELETOR REAL DOS LINKS DO BREADCRUMB
            const text = $(el).text()?.trim();
            if (text) {
                 categoriaOriginal += (categoriaOriginal ? " > " : "") + text;
            }
        });

        // --- Avaliação Média ---
        // Exemplo: <div class="flex items-center"> <div class="OitLRu"> 4.8 </div> ... </div> -> Seletor: 'div.OitLRu'
        const avaliacaoMediaOriginalText = $('div.OitLRu').first().text()?.trim(); // <- SUBSTITUA PELO SELETOR REAL
        const avaliacaoMediaOriginal = avaliacaoMediaOriginalText ? `${avaliacaoMediaOriginalText} Estrelas` : "Não encontrada";

        // --- Quantidade de Avaliações ---
        // Exemplo: <div class="flex items-center"> ... <div class="acaUPX"> 1.2k </div> <span> avaliações </span> ... </div> -> Seletor: 'div.acaUPX'
        const quantidadeAvaliacoesOriginalText = $('div.acaUPX').first().text()?.trim(); // <- SUBSTITUA PELO SELETOR REAL
        const quantidadeAvaliacoesOriginal = quantidadeAvaliacoesOriginalText ? `${quantidadeAvaliacoesOriginalText} Avaliações` : "Não encontrada";

        // --- Nome da Loja ---
        // Exemplo: <div class="_6i8g4v"> <div class="official-shop-name"> NOME DA LOJA </div> </div> -> Seletor: 'div.official-shop-name'
        const nomeLojaOriginal = $('div.official-shop-name').text()?.trim(); // <- SUBSTITUA PELO SELETOR REAL

        // --- Variações ---
        // Exemplo: <div class="flex items-center Kz6OLM"> <button> VARIAÇÃO 1 </button> <button> VARIAÇÃO 2 </button> </div> -> Seletor: 'div.Kz6OLM button'
        const variacoesOriginais = [];
        $('div.Kz6OLM button').each((i, el) => { // <- SUBSTITUA PELO SELETOR REAL
            const text = $(el).text()?.trim();
            if (text) variacoesOriginais.push(text);
        });
        // =====================================================================

        console.log("[Scraper] Extração concluída (verificar precisão dos dados).");

        const dadosExtraidos = {
            tituloOriginal: tituloOriginal || "Título não encontrado",
            descricaoOriginal: descricaoOriginal || "Descrição não encontrada",
            precoOriginal: precoOriginal || "Preço não encontrado",
            categoriaOriginal: categoriaOriginal || "Categoria não encontrada",
            avaliacaoMediaOriginal: avaliacaoMediaOriginal,
            quantidadeAvaliacoesOriginal: quantidadeAvaliacoesOriginal,
            nomeLojaOriginal: nomeLojaOriginal || "Loja não encontrada",
            variacoesOriginais: variacoesOriginais.length > 0 ? variacoesOriginais : ["Variações não encontradas"]
        };

        console.log("[Scraper] Dados extraídos:", JSON.stringify(dadosExtraidos, null, 2));

        if (dadosExtraidos.tituloOriginal === "Título não encontrado" && dadosExtraidos.descricaoOriginal === "Descrição não encontrada") {
             console.warn("[Scraper] Não foi possível extrair título nem descrição. Provavelmente os seletores estão incorretos ou a página mudou.");
        }

        return dadosExtraidos;

    } catch (error) {
        console.error(`[Scraper] Erro durante o scraping de ${url}:`, error.message);
        if (error.response) {
            console.error("[Scraper] Status do erro HTTP:", error.response.status);
            if (error.response.status >= 400) {
                 throw new Error(`Falha ao acessar a página do produto (Status ${error.response.status}). Verifique o link ou a Shopee pode ter bloqueado o acesso.`);
            }
        }
        throw new Error(`Falha ao fazer scraping da URL: ${error.message}`);
    }
}

module.exports = { scrapeShopeeProduct };
