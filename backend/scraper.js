// scraper.js - Tentativa de Scraping Real (baseado nos seletores fornecidos)
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

        // --- Título ---
        // Seletor atualizado com base na sua informação: h1 com classe vR6K3w
        const tituloOriginal = $('h1.vR6K3w').first().text()?.trim() 
                            || $('meta[property="og:title"]').attr('content')?.trim(); 

        // --- Descrição ---
        // Concatena o texto de todos os parágrafos <p class="QN2lPu"> dentro da seção de descrição
        let descricaoOriginal = "";
         $('section.I_DV_3:has(h2.WjNdTR:contains("Descrição do produto")) div.e8lZp3 p.QN2lPu').each((i, el) => {
             const paragraphText = $(el).text()?.trim();
             if (paragraphText) {
                 descricaoOriginal += paragraphText + "\n"; 
             }
         });
         descricaoOriginal = descricaoOriginal.trim() || $('meta[property="og:description"]').attr('content')?.trim(); 

        // --- Preço ---
        // Seletor baseado no HTML: <div class="IZPeQz B67UQ0">...</div>
        const precoOriginal = $('div.IZPeQz.B67UQ0').first().text()?.trim(); 

        // --- Categoria (Breadcrumbs) ---
        // Seletor baseado no HTML: <a class="EtYbJs R7vGdX">...</a> dentro de <div class="flex items-center idLK2l">
        let categoriaOriginal = "";
        $('div.page-product_breadcrumb a.EtYbJs.R7vGdX').each((i, el) => { 
            const text = $(el).text()?.trim();
            if (text && (text.toLowerCase() !== 'shopee')) { 
                 categoriaOriginal += (categoriaOriginal ? " > " : "") + text;
            }
        });
         if (!categoriaOriginal) { // Fallback para a outra estrutura de categoria
             $('div.ybxj32:has(h3.VJOnTD:contains("Categoria")) div.idLK2l a.EtYbJs.R7vGdX').each((i, el) => {
                 const text = $(el).text()?.trim();
                 if (text && (text.toLowerCase() !== 'shopee')) {
                      categoriaOriginal += (categoriaOriginal ? " > " : "") + text;
                 }
             });
         }

        // --- Avaliação Média (do produto) ---
        // Seletor baseado no HTML: <div class="F9RHbS dQEiAI jMXp4d">4.8</div>
        const avaliacaoMediaOriginalText = $('div.flex.asFzUa button.flex.e2p50f div.F9RHbS.dQEiAI.jMXp4d').first().text()?.trim();
        const avaliacaoMediaOriginal = avaliacaoMediaOriginalText ? `${avaliacaoMediaOriginalText} Estrelas` : "Não encontrada";

        // --- Quantidade de Avaliações (do produto) ---
        // Seletor baseado no HTML: <div class="F9RHbS">12,4mil</div> ao lado de <div class="x1i_He">Avaliações</div>
        const quantidadeAvaliacoesOriginalText = $('div.flex.asFzUa button.flex.e2p50f div.x1i_He:contains("Avaliações")').prev('div.F9RHbS').text()?.trim();
        const quantidadeAvaliacoesOriginal = quantidadeAvaliacoesOriginalText ? `${quantidadeAvaliacoesOriginalText} Avaliações` : "Não encontrada";
        
        // --- Nome da Loja ---
        // Seletor baseado no HTML: <div class="fV3TIn">Ferraz Modas</div>
        const nomeLojaOriginal = $('div.r74CsV div.PYEGyz div.fV3TIn').first().text()?.trim(); 

        // --- Variações ---
        // Seletor baseado no HTML: <button class="sApkZm" aria-label="...">...</button>
        const variacoesOriginais = [];
        $('div.flex.items-center.j7HL5Q button.sApkZm').each((i, el) => { 
            const text = $(el).attr('aria-label')?.trim(); 
            if (text) variacoesOriginais.push(text);
        });
        
        console.log("[Scraper] Extração preliminar concluída.");

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
             console.warn("[Scraper] Não foi possível extrair título nem descrição. Seletores podem estar incorretos ou a página mudou.");
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
