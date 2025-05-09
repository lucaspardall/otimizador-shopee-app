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
    console.log("Módulo scraper.js carregado com sucesso."); // Log adicionado
} catch (e) {
    console.error("ERRO FATAL: Não foi possível carregar './scraper'. Verifique se o ficheiro existe e não tem erros de sintaxe.", e);
    // Define uma função mock que sempre falha, para que o erro seja claro mais tarde
    scrapeShopeeProduct = async () => { throw new Error("Falha ao carregar scraper.js"); };
}
try {
    require.resolve('./aiService');
    callYourAI = require('./aiService').callYourAI;
    console.log("Módulo aiService.js carregado com sucesso."); // Log adicionado
} catch (e) {
    console.error("ERRO FATAL: Não foi possível carregar './aiService'. Verifique se o ficheiro existe e não tem erros de sintaxe.", e);
    // Define uma função mock
    callYourAI = async () => { throw new Error("Falha ao carregar aiService.js"); };
}
// --- Fim da importação ---


const app = express();
// Define a porta. Usa a porta fornecida pelo ambiente (ex: Render) ou 3001 para testes locais.
const PORT = process.env.PORT || 3001;

// --- Middlewares Essenciais ---
console.log("Configurando middlewares..."); // Log adicionado
// 1. Habilita o servidor a entender corpos de requisição em JSON (IMPORTANTE: antes do CORS se ele precisar ler headers customizados, mas geralmente a ordem aqui não é crítica)
app.use(express.json());

// 2. Configuração do CORS Simplificada (Permite QUALQUER origem - APENAS PARA TESTE)
console.log("ATENÇÃO: Configuração CORS permitindo qualquer origem (para teste).");
app.use(cors()); // Mantendo CORS simplificado por enquanto
console.log("Middlewares configurados."); // Log adicionado


// --- Rotas da API ---

// Rota Principal (para verificar se a API está no ar)
app.get('/', (req, res) => {
    console.log("Recebido pedido GET em /"); // Log adicionado
    // Envia uma mensagem simples indicando que a API está funcional
    res.send('API do Otimizador Shopee está no ar! (Versão Completa)'); // Mensagem atualizada
});

// Rota para verificar o Chrome
app.get('/check-chrome', async (req, res) => {
    console.log("Recebido pedido GET em /check-chrome");
    const puppeteer = require('puppeteer');
    try {
        // Coleta informações sobre o ambiente
        const environmentInfo = {
            node_version: process.version,
            platform: process.platform,
            arch: process.arch,
            env_vars: {
                PATH: process.env.PATH?.substring(0, 100) + '...',
                PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH || "não definido"
            }
        };
        
        // Verifica o Puppeteer
        const browserFetcher = puppeteer.createBrowserFetcher();
        
        // Tenta listar as revisões disponíveis
        const localRevisions = await browserFetcher.localRevisions();
        
        // Tenta iniciar o navegador - teste real
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const version = await browser.version();
        await browser.close();
        
        // Retorna todas as informações coletadas
        res.json({
            status: "success",
            message: "Chrome está instalado e funcionando",
            chrome_version: version,
            local_revisions: localRevisions,
            cache_path: browserFetcher.cachePath,
            environment: environmentInfo
        });
    } catch (error) {
        // Se houver erro, retorna detalhes completos
        res.status(500).json({
            status: "error",
            message: "Erro ao verificar o Chrome",
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            }
        });
    }
});

// Rota PRINCIPAL para analisar o produto Shopee (LÓGICA REAL RESTAURADA)
app.post('/api/analisar-produto', async (req, res) => {
    console.log("Recebido pedido POST em /api/analisar-produto (Lógica Completa)"); // Log adicionado
    // 1. Extrai a URL do produto do corpo da requisição enviada pelo frontend
    const { shopeeProductUrl } = req.body;

    // 2. Validação Inicial: Verifica se a URL foi realmente enviada
    if (!shopeeProductUrl) {
        console.log("ERRO: URL do produto não fornecida na requisição."); // Log de erro
        // Retorna um erro 400 (Bad Request) se a URL estiver faltando
        return res.status(400).json({ status: "erro", mensagem: "URL do produto não fornecida." });
    }

    // Validação básica do formato da URL (opcional, mas recomendado)
    try {
        new URL(shopeeProductUrl); // Tenta criar um objeto URL
        console.log(`URL recebida e validada: ${shopeeProductUrl}`); // Log adicionado
    } catch (e) {
        console.log("ERRO: Formato de URL inválido:", shopeeProductUrl); // Log de erro
        return res.status(400).json({ status: "erro", mensagem: "Formato de URL inválido." });
    }


    // 3. Bloco try...catch para lidar com possíveis erros durante o processo
    try {
        // --- Bloco principal do processamento ---
        console.log("[1/3] Iniciando scraping..."); // Log de etapa
        const dadosOriginais = await scrapeShopeeProduct(shopeeProductUrl); // Chama a função real
        console.log("[1/3] Scraping tentou executar."); // Log de etapa

        // Verifica se o scraping retornou dados válidos (ajuste: verifica se é um objeto e tem chaves)
        if (!dadosOriginais || typeof dadosOriginais !== 'object' || Object.keys(dadosOriginais).length === 0) {
             console.log("ERRO: Scraping não retornou dados válidos ou retornou objeto vazio."); // Log de erro
             // Considerar retornar 422 (Unprocessable Entity) ou 502 (Bad Gateway) se o scraping falhar
             return res.status(500).json({ status: "erro", mensagem: "Não foi possível extrair dados do produto. Verifique o link ou tente novamente." });
        }
        console.log("[1/3] Scraping concluído com sucesso (Título: " + dadosOriginais.tituloOriginal + ")."); // Log de sucesso

        console.log("[2/3] Chamando a IA..."); // Log de etapa
        const resultadoIA = await callYourAI(dadosOriginais); // Chama a função real
        console.log("[2/3] Chamada da IA tentou executar."); // Log de etapa

         // Verifica se a IA retornou dados válidos
        if (!resultadoIA || !resultadoIA.dadosOtimizados) {
             console.log("ERRO: Chamada da IA não retornou dados otimizados válidos."); // Log de erro
             return res.status(500).json({ status: "erro", mensagem: "A IA não retornou um resultado válido." });
        }
        console.log("[2/3] IA retornou com sucesso (Título Otimizado: " + resultadoIA.dadosOtimizados.tituloOtimizado + ")."); // Log de sucesso

        // 3.3. Monta a resposta final para enviar de volta ao frontend
        const respostaFinal = {
            status: "sucesso",
            mensagem: "Análise concluída com sucesso!",
            dadosOriginais: dadosOriginais,
            dadosOtimizados: resultadoIA.dadosOtimizados,
            // Garante que insightsDaIA seja sempre um array
            insightsDaIA: Array.isArray(resultadoIA.insightsDaIA) ? resultadoIA.insightsDaIA : []
        };

        // 3.4. Envia a resposta final em formato JSON para o frontend
        console.log("[3/3] Enviando resposta final para o frontend."); // Log de etapa
        res.json(respostaFinal);
        // --- Fim do bloco principal ---

    } catch (error) {
        // 3.5. Captura qualquer erro que ocorra no try (seja no scraping ou na chamada da IA)
        console.error("ERRO CRÍTICO dentro do try/catch de /api/analisar-produto:", error); // Log de erro crítico
        // Envia uma resposta de erro genérica para o frontend
        res.status(500).json({
            status: "erro",
            mensagem: error.message || "Erro interno grave no servidor."
        });
    }
});

// Inicia o servidor para escutar na porta definida
app.listen(PORT, () => {
    console.log(`Servidor backend iniciado e a escutar na porta ${PORT} (Versão Completa)`); // Log de inicialização
});
