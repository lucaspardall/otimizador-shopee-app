// scraper.js - AJUSTAR SELETORES CSS (v4)
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
        // == Seletores atualizados com base nas informações fornecidas.     ==
        // == Alguns ainda podem precisar de ajuste fino ou não existir em  ==
        // == todas as páginas.                                             ==
        // =====================================================================

        // --- Título ---
        const tituloOriginal = $('h1.vR6K3w').first().text()?.trim() 
                            || $('meta[property="og:title"]').attr('content')?.trim(); 

        // --- Descrição ---
        let descricaoOriginal = "";
         $('div.e8lZp3 p.QN2lPu').each((i, el) => {
             const paragraphText = $(el).text()?.trim();
             if (paragraphText) {
                 descricaoOriginal += paragraphText + "\n"; 
             }
         });
         descricaoOriginal = descricaoOriginal.trim() || $('meta[property="og:description"]').attr('content')?.trim();

        // --- Preço ---
        const precoOriginal = $('div.IZPeQz.B67UQ0').first().text()?.trim(); 

        // --- Categoria ---
        let categoriaOriginal = "";
        $('div.ybxj32 div.idLK2l a.EtYbJs.R7vGdX').each((i, el) => { 
            const text = $(el).text()?.trim();
            if (text && (text.toLowerCase() !== 'shopee' || $(el).attr('href') !== '/')) {
                 categoriaOriginal += (categoriaOriginal ? " > " : "") + text;
            }
        });
         if (!categoriaOriginal) {
             $('div[class*="breadcrumb"] a').each((i, el) => {
                 const text = $(el).text()?.trim();
                 if (text && text.toLowerCase() !== 'shopee') {
                      categoriaOriginal += (categoriaOriginal ? " > " : "") + text;
                 }
             });
         }

        // --- Avaliação Média ---
        const avaliacaoMediaOriginalText = $('span.product-rating-overview__rating-score').first().text()?.trim();
        const avaliacaoMediaOriginal = avaliacaoMediaOriginalText ? `${avaliacaoMediaOriginalText} Estrelas` : "Não encontrada";

        // --- Quantidade de Avaliações ---
        // Seletor atualizado para o novo HTML fornecido
        let quantidadeAvaliacoesOriginalText = "";
        $('div.YnZi6x').each((i, el) => {
            const label = $(el).find('label.ffHYws').text()?.trim();
            if (label === 'Avaliações') {
                quantidadeAvaliacoesOriginalText = $(el).find('span.Cs6w3G').text()?.trim();
                return false; // Para o loop .each assim que encontrar
            }
        });
        const quantidadeAvaliacoesOriginal = quantidadeAvaliacoesOriginalText ? `${quantidadeAvaliacoesOriginalText} Avaliações` : "Não encontrada";


        // --- Nome da Loja ---
        // Seletor atualizado para o novo HTML fornecido
        const nomeLojaOriginal = $('div.fV3TIn').first().text()?.trim(); 

        // --- Variações ---
        const variacoesOriginais = [];
        $('button.sApkZm').each((i, el) => { 
            const text = $(el).attr('aria-label')?.trim(); 
            if (text) variacoesOriginais.push(text);
        });
        
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
             console.warn("[Scraper] Não foi possível extrair título nem descrição. Seletores podem estar incorretos.");
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
