// server.js - Versão Corrigida com CORS Explícito

// Importa os módulos necessários
const express = require('express');
const cors = require('cors');
const { scrapeShopeeProduct } = require('./scraper'); // Importa a função de scraping
const { callYourAI } = require('./aiService'); // Importa a função para chamar sua IA

const app = express();
// Define a porta. Usa a porta fornecida pelo ambiente (ex: Render) ou 3001 para testes locais.
const PORT = process.env.PORT || 3001;

// Middlewares Essenciais

// Configuração explícita do CORS:
// Substitua 'https://otimizador-shopee-app-1.onrender.com' pela URL exata do seu frontend no Render.
app.use(cors({
  origin: 'https://otimizador-shopee-app-1.onrender.com' // Permite SOMENTE o seu frontend hospedado no Render
}));

app.use(express.json()); // Habilita o servidor a entender corpos de requisição em JSON

// Rota Principal (para verificar se a API está no ar)
app.get('/', (req, res) => {
    // Envia uma mensagem simples indicando que a API está funcional
    res.send('API do Otimizador Shopee está no ar!');
});

// Rota PRINCIPAL para analisar o produto Shopee
app.post('/api/analisar-produto', async (req, res) => {
    // 1. Extrai a URL do produto do corpo da requisição enviada pelo frontend
    const { shopeeProductUrl } = req.body;

    // 2. Validação Inicial: Verifica se a URL foi realmente enviada
    if (!shopeeProductUrl) {
        console.log("Requisição recebida sem shopeeProductUrl");
        // Retorna um erro 400 (Bad Request) se a URL estiver faltando
        return res.status(400).json({ status: "erro", mensagem: "URL do produto não fornecida." });
    }

    console.log(`Recebida requisição para analisar: ${shopeeProductUrl}`);

    // 3. Bloco try...catch para lidar com possíveis erros durante o processo
    try {
        // 3.1. Chama a função de scraping (definida em scraper.js)
        console.log("Iniciando scraping...");
        // IMPORTANTE: A função scrapeShopeeProduct precisa ser implementada corretamente em scraper.js
        const dadosOriginais = await scrapeShopeeProduct(shopeeProductUrl);
        // Verifica se o scraping retornou dados válidos
        if (!dadosOriginais || Object.keys(dadosOriginais).length === 0) {
             console.log("Scraping não retornou dados válidos.");
             // Retorna um erro 500 (Internal Server Error) ou talvez 404 (Not Found) se não extraiu nada
             return res.status(500).json({ status: "erro", mensagem: "Não foi possível extrair dados do produto da URL fornecida." });
        }
        console.log("Scraping concluído. Dados extraídos:", dadosOriginais.tituloOriginal); // Loga apenas o título para não poluir muito

        // 3.2. Chama a sua IA (função definida em aiService.js) com os dados extraídos
        console.log("Chamando a IA...");
        // IMPORTANTE: A função callYourAI precisa ser implementada corretamente em aiService.js
        const resultadoIA = await callYourAI(dadosOriginais);
        console.log("IA retornou. Título otimizado:", resultadoIA.dadosOtimizados.tituloOtimizado); // Loga o título otimizado

        // 3.3. Monta a resposta final para enviar de volta ao frontend
        const respostaFinal = {
            status: "sucesso",
            mensagem: "Análise concluída com sucesso!",
            dadosOriginais: dadosOriginais, // Inclui os dados originais extraídos
            dadosOtimizados: resultadoIA.dadosOtimizados, // Inclui título/descrição otimizados pela IA
            insightsDaIA: resultadoIA.insightsDaIA // Inclui os insights estratégicos da IA
        };

        // 3.4. Envia a resposta final em formato JSON para o frontend
        console.log("Enviando resposta final para o frontend.");
        res.json(respostaFinal);

    } catch (error) {
        // 3.5. Captura qualquer erro que ocorra no try (seja no scraping ou na chamada da IA)
        console.error("Erro detalhado no endpoint /api/analisar-produto:", error); // Loga o erro completo no console do servidor
        // Envia uma resposta de erro genérica para o frontend
        res.status(500).json({
            status: "erro",
            // Envia a mensagem de erro específica se disponível, senão uma genérica
            mensagem: error.message || "Erro interno no servidor ao processar a solicitação."
        });
    }
});

// Inicia o servidor para escutar na porta definida
app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
});
