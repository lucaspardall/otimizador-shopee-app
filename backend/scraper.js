// scraper.js - Seletores Refinados com base no HTML Completo
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
        // Prioriza o h1 com a classe vR6K3w, depois a meta tag og:title
        const tituloOriginal = $('div.WBVL_7 > h1.vR6K3w').first().text()?.trim() 
                            || $('meta[property="og:title"]').attr('content')?.trim(); 

        // --- Descrição ---
        // Concatena o texto de todos os parágrafos dentro da div.e8lZp3
        let descricaoOriginal = "";
         $('section.I_DV_3:has(h2.WjNdTR:contains("Descrição do produto")) div.e8lZp3 p.QN2lPu').each((i, el) => {
             const paragraphText = $(el).text()?.trim();
             if (paragraphText) {
                 descricaoOriginal += paragraphText + "\n"; 
             }
         });
         descricaoOriginal = descricaoOriginal.trim() || $('meta[property="og:description"]').attr('content')?.trim(); 

        // --- Preço ---
        // Usa a div específica que contém o preço ou faixa de preço
        const precoOriginal = $('div.jRlVo0 div.IZPeQz.B67UQ0').first().text()?.trim(); 

        // --- Categoria (Breadcrumbs) ---
        // Pega os links do breadcrumb principal da página do produto
        let categoriaOriginal = "";
        $('div.page-product_breadcrumb a.EtYbJs').each((i, el) => { 
            const text = $(el).text()?.trim();
            if (text && (text.toLowerCase() !== 'shopee')) { // Ignora o link "Shopee"
                 categoriaOriginal += (categoriaOriginal ? " > " : "") + text;
            }
        });
        // Fallback se o primeiro seletor não encontrar nada (para a estrutura da seção "Detalhes do Produto")
        if (!categoriaOriginal) {
             $('div.ybxj32:has(h3.VJOnTD:contains("Categoria")) div.idLK2l a.EtYbJs').each((i, el) => {
                 const text = $(el).text()?.trim();
                 if (text && (text.toLowerCase() !== 'shopee')) {
                      categoriaOriginal += (categoriaOriginal ? " > " : "") + text;
                 }
             });
        }


        // --- Avaliação Média (do produto) ---
        // Pega o score principal da avaliação do produto
        const avaliacaoMediaOriginalText = $('div.flex.asFzUa button.flex.e2p50f div.F9RHbS.dQEiAI.jMXp4d').first().text()?.trim();
        const avaliacaoMediaOriginal = avaliacaoMediaOriginalText ? `${avaliacaoMediaOriginalText} Estrelas` : "Não encontrada";

        // --- Quantidade de Avaliações (do produto) ---
        // Pega o número de avaliações totais do produto
        const quantidadeAvaliacoesOriginalText = $('div.flex.asFzUa button.flex.e2p50f div.x1i_He:contains("Avaliações")').prev('div.F9RHbS').text()?.trim();
        const quantidadeAvaliacoesOriginal = quantidadeAvaliacoesOriginalText ? `${quantidadeAvaliacoesOriginalText} Avaliações` : "Não encontrada";
        
        // --- Nome da Loja ---
        // Pega o nome da loja na seção de informações do vendedor
        const nomeLojaOriginal = $('div.r74CsV div.PYEGyz div.fV3TIn').first().text()?.trim(); 

        // --- Variações ---
        // Pega o aria-label dos botões de variação, que geralmente contém o texto limpo
        const variacoesOriginais = [];
        // Procura por seções de variação e depois pelos botões dentro delas
        $('div.flex.flex-column.tKNJvJ section.flex.items-center:has(h2.Dagtcd)').each((i, sectionEl) => {
            const tipoVariacao = $(sectionEl).find('h2.Dagtcd').text()?.trim();
            $(sectionEl).find('div.flex.items-center.j7HL5Q button.sApkZm').each((j, btnEl) => {
                const opcaoVariacao = $(btnEl).attr('aria-label')?.trim();
                if (tipoVariacao && opcaoVariacao) {
                    variacoesOriginais.push(`${tipoVariacao}: ${opcaoVariacao}`);
                } else if (opcaoVariacao) {
                    variacoesOriginais.push(opcaoVariacao);
                }
            });
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
