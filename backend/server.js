    // server.js - Versão Restaurada com Lógica Completa e CORS Simplificado

    // Importa os módulos necessários
    const express = require('express');
    const cors = require('cors');
    // IMPORTANTE: Certifique-se que os arquivos scraper.js e aiService.js existem
    // e exportam as funções corretamente.
    let scrapeShopeeProduct, callYourAI;
    try {
        require.resolve('./scraper');
        scrapeShopeeProduct = require('./scraper').scrapeShopeeProduct;
        console.log("Módulo scraper.js carregado com sucesso.");
    } catch (e) {
        console.error("ERRO FATAL: Não foi possível carregar './scraper'.", e);
        scrapeShopeeProduct = async () => { throw new Error("Falha ao carregar scraper.js"); };
    }
    try {
        require.resolve('./aiService');
        callYourAI = require('./aiService').callYourAI;
        console.log("Módulo aiService.js carregado com sucesso.");
    } catch (e) {
        console.error("ERRO FATAL: Não foi possível carregar './aiService'.", e);
        callYourAI = async () => { throw new Error("Falha ao carregar aiService.js"); };
    }

    const app = express();
    const PORT = process.env.PORT || 3001;

    // --- Middlewares Essenciais ---
    console.log("Configurando middlewares...");
    app.use(express.json());
    console.log("ATENÇÃO: Configuração CORS permitindo qualquer origem (para teste).");
    app.use(cors()); // Mantendo CORS simplificado por enquanto
    console.log("Middlewares configurados.");

    // --- Rotas da API ---
    app.get('/', (req, res) => {
        console.log("Recebido pedido GET em /");
        res.send('API do Otimizador Shopee está no ar! (Versão Completa)'); // Mensagem atualizada
    });

    // Rota PRINCIPAL para analisar o produto Shopee (LÓGICA REAL)
    app.post('/api/analisar-produto', async (req, res) => {
        console.log("Recebido pedido POST em /api/analisar-produto (Lógica Completa)");
        const { shopeeProductUrl } = req.body;

        if (!shopeeProductUrl) {
            console.log("ERRO: URL do produto não fornecida.");
            return res.status(400).json({ status: "erro", mensagem: "URL do produto não fornecida." });
        }
        try {
            new URL(shopeeProductUrl);
            console.log(`URL recebida e validada: ${shopeeProductUrl}`);
        } catch (e) {
            console.log("ERRO: Formato de URL inválido:", shopeeProductUrl);
            return res.status(400).json({ status: "erro", mensagem: "Formato de URL inválido." });
        }

        try {
            // --- Bloco principal do processamento ---
            console.log("[1/3] Iniciando scraping...");
            const dadosOriginais = await scrapeShopeeProduct(shopeeProductUrl); // Chama a função real
            console.log("[1/3] Scraping tentou executar.");

            if (!dadosOriginais || typeof dadosOriginais !== 'object' || Object.keys(dadosOriginais).length === 0) {
                 console.log("ERRO: Scraping não retornou dados válidos.");
                 return res.status(500).json({ status: "erro", mensagem: "Não foi possível extrair dados do produto. Verifique o link ou tente novamente." });
            }
            console.log("[1/3] Scraping concluído com sucesso (Título: " + dadosOriginais.tituloOriginal + ").");

            console.log("[2/3] Chamando a IA...");
            const resultadoIA = await callYourAI(dadosOriginais); // Chama a função real
            console.log("[2/3] Chamada da IA tentou executar.");

            if (!resultadoIA || !resultadoIA.dadosOtimizados) {
                 console.log("ERRO: Chamada da IA não retornou dados otimizados válidos.");
                 return res.status(500).json({ status: "erro", mensagem: "A IA não retornou um resultado válido." });
            }
            console.log("[2/3] IA retornou com sucesso (Título Otimizado: " + resultadoIA.dadosOtimizados.tituloOtimizado + ").");

            const respostaFinal = {
                status: "sucesso",
                mensagem: "Análise concluída com sucesso!",
                dadosOriginais: dadosOriginais,
                dadosOtimizados: resultadoIA.dadosOtimizados,
                insightsDaIA: Array.isArray(resultadoIA.insightsDaIA) ? resultadoIA.insightsDaIA : []
            };

            console.log("[3/3] Enviando resposta final para o frontend.");
            res.json(respostaFinal);
            // --- Fim do bloco principal ---

        } catch (error) {
            // Captura erros de scrapeShopeeProduct ou callYourAI
            console.error("ERRO CRÍTICO dentro do try/catch de /api/analisar-produto:", error);
            res.status(500).json({
                status: "erro",
                mensagem: error.message || "Erro interno grave no servidor."
            });
        }
    });

    // Inicia o servidor
    app.listen(PORT, () => {
        console.log(`Servidor backend iniciado e a escutar na porta ${PORT} (Versão Completa)`);
    });
    
