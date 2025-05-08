// server.js - Versão com CORS Simplificado para Teste

// Importa os módulos necessários
const express = require('express');
const cors = require('cors');
// IMPORTANTE: Certifique-se que os arquivos scraper.js e aiService.js existem
// e exportam as funções corretamente.
// Se eles não existirem ou tiverem erros, o require vai falhar.
let scrapeShopeeProduct, callYourAI;
try {
    scrapeShopeeProduct = require('./scraper').scrapeShopeeProduct;
} catch (e) {
    console.error("Erro ao importar scraper.js:", e.message);
    // Define uma função mock para evitar que o servidor quebre se o arquivo não existir
    scrapeShopeeProduct = async () => { throw new Error("Módulo scraper.js não encontrado ou com erro."); };
}
try {
    callYourAI = require('./aiService').callYourAI;
} catch (e) {
    console.error("Erro ao importar aiService.js:", e.message);
    // Define uma função mock
    callYourAI = async () => { throw new Error("Módulo aiService.js não encontrado ou com erro."); };
}


const app = express();
// Define a porta. Usa a porta fornecida pelo ambiente (ex: Render) ou 3001 para testes locais.
const PORT = process.env.PORT || 3001;

// --- Middlewares Essenciais ---

// 1. Habilita o servidor a entender corpos de requisição em JSON (IMPORTANTE: antes do CORS se ele precisar ler headers customizados, mas geralmente a ordem aqui não é crítica)
app.use(express.json());

// 2. Configuração do CORS Simplificada (Permite QUALQUER origem - APENAS PARA TESTE)
console.log("ATENÇÃO: Configuração CORS permitindo qualquer origem (para teste).");
app.use(cors());


// --- Rotas da API ---

// Rota Principal (para verificar se a API está no ar)
app.get('/', (req, res) => {
    // Envia uma mensagem simples indicando que a API está funcional
    res.send('API do Otimizador Shopee está no ar!');
});

// Rota PRINCIPAL para analisar o produto Shopee
// Não precisamos mais do app.options separado quando usamos cors() sem opções específicas.
app.post('/api/analisar-produto', async (req, res) => {
    // 1. Extrai a URL do produto do corpo da requisição enviada pelo frontend
    const { shopeeProductUrl } = req.body;

    // 2. Validação Inicial: Verifica se a URL foi realmente enviada
    if (!shopeeProductUrl) {
        console.log("Requisição recebida sem shopeeProductUrl");
        // Retorna um erro 400 (Bad Request) se a URL estiver faltando
        return res.status(400).json({ status: "erro", mensagem: "URL do produto não fornecida." });
    }

    // Validação básica do formato da URL (opcional, mas recomendado)
    try {
        new URL(shopeeProductUrl); // Tenta criar um objeto URL
    } catch (e) {
        console.log("URL inválida recebida:", shopeeProductUrl);
        return res.status(400).json({ status: "erro", mensagem: "Formato de URL inválido." });
    }


    console.log(`Recebida requisição para analisar: ${shopeeProductUrl}`);

    // 3. Bloco try...catch para lidar com possíveis erros durante o processo
    try {
        // 3.1. Chama a função de scraping (definida em scraper.js)
        console.log("Iniciando scraping...");
        const dadosOriginais = await scrapeShopeeProduct(shopeeProductUrl);
        // Verifica se o scraping retornou dados válidos (ajuste: verifica se é um objeto e tem chaves)
        if (!dadosOriginais || typeof dadosOriginais !== 'object' || Object.keys(dadosOriginais).length === 0) {
             console.log("Scraping não retornou dados válidos ou retornou objeto vazio.");
             return res.status(500).json({ status: "erro", mensagem: "Não foi possível extrair dados do produto da URL fornecida. Verifique o link ou a estrutura da página pode ter mudado." });
        }
        console.log("Scraping concluído. Dados extraídos (título):", dadosOriginais.tituloOriginal);

        // 3.2. Chama a sua IA (função definida em aiService.js) com os dados extraídos
        console.log("Chamando a IA...");
        const resultadoIA = await callYourAI(dadosOriginais);
         // Verifica se a IA retornou dados válidos
        if (!resultadoIA || !resultadoIA.dadosOtimizados) {
             console.log("Chamada da IA não retornou dados otimizados válidos.");
             return res.status(500).json({ status: "erro", mensagem: "A IA não retornou um resultado válido." });
        }
        console.log("IA retornou. Título otimizado:", resultadoIA.dadosOtimizados.tituloOtimizado);

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
        console.log("Enviando resposta final para o frontend.");
        res.json(respostaFinal);

    } catch (error) {
        // 3.5. Captura qualquer erro que ocorra no try (seja no scraping ou na chamada da IA)
        console.error("Erro detalhado no endpoint /api/analisar-produto:", error);
        // Envia uma resposta de erro genérica para o frontend
        res.status(500).json({
            status: "erro",
            mensagem: error.message || "Erro interno no servidor ao processar a solicitação."
        });
    }
});

// Inicia o servidor para escutar na porta definida
app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
});
