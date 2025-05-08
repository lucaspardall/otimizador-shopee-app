// server.js - Versão Ultra-Simplificada para Teste de Comunicação

// Importa os módulos necessários
const express = require('express');
const cors = require('cors');

// Não precisamos importar scraper e aiService nesta versão de teste,
// mas mantemos a estrutura para facilitar a volta depois.
// let scrapeShopeeProduct, callYourAI;
// try {
//     require.resolve('./scraper');
//     scrapeShopeeProduct = require('./scraper').scrapeShopeeProduct;
//     console.log("Módulo scraper.js carregado com sucesso.");
// } catch (e) {
//     console.error("ERRO FATAL: Não foi possível carregar './scraper'.", e);
// }
// try {
//     require.resolve('./aiService');
//     callYourAI = require('./aiService').callYourAI;
//     console.log("Módulo aiService.js carregado com sucesso.");
// } catch (e) {
//     console.error("ERRO FATAL: Não foi possível carregar './aiService'.", e);
// }


const app = express();
// Define a porta. Usa a porta fornecida pelo ambiente (ex: Render) ou 3001 para testes locais.
const PORT = process.env.PORT || 3001;

// --- Middlewares Essenciais ---
console.log("Configurando middlewares...");
// 1. Habilita o servidor a entender corpos de requisição em JSON
app.use(express.json());
// 2. Configuração do CORS Simplificada (Permite QUALQUER origem - APENAS PARA TESTE)
console.log("ATENÇÃO: Configuração CORS permitindo qualquer origem (para teste).");
app.use(cors());
console.log("Middlewares configurados.");


// --- Rotas da API ---

// Rota Principal (para verificar se a API está no ar)
app.get('/', (req, res) => {
    console.log("Recebido pedido GET em /");
    res.send('API do Otimizador Shopee está no ar! (Versão de Teste Simplificada)'); // Mensagem atualizada
});

// =========================================================================
// == Rota PRINCIPAL para analisar o produto Shopee - VERSÃO SIMPLIFICADA ==
// =========================================================================
app.post('/api/analisar-produto', async (req, res) => {
    console.log("Recebido pedido POST em /api/analisar-produto (versão ultra-simplificada)");
    const { shopeeProductUrl } = req.body;

    // Validação básica da URL recebida
    if (!shopeeProductUrl) {
        console.log("ERRO (simplificado): URL do produto não fornecida.");
        return res.status(400).json({ status: "erro", mensagem: "URL do produto não fornecida." });
    }
    try {
        new URL(shopeeProductUrl); // Só para validar o formato
        console.log(`URL recebida (simplificado): ${shopeeProductUrl}`);
    } catch(e){
         console.log("ERRO (simplificado): Formato de URL inválido.");
         return res.status(400).json({ status: "erro", mensagem: "Formato de URL inválido." });
    }


    // ===== NÃO CHAMA SCRAPING NEM IA NESTA VERSÃO =====

    // APENAS DEVOLVE UMA RESPOSTA DE SUCESSO MOCKADA IMEDIATAMENTE
    const mockUltraSimplificado = {
        status: "sucesso",
        mensagem: "Comunicação com Backend OK (teste ultra-simplificado)!",
        dadosOriginais: { // Dados mínimos para o frontend não quebrar
            tituloOriginal: "Teste Backend OK",
            descricaoOriginal: "Se você vê isto, a comunicação básica funcionou.",
            precoOriginal: "R$ 0,00",
            categoriaOriginal: "Teste",
            avaliacaoMediaOriginal: "5 Estrelas",
            quantidadeAvaliacoesOriginal: "1 Avaliação",
            nomeLojaOriginal: "Loja Teste",
            variacoesOriginais: ["Teste"]
        },
        dadosOtimizados: { // Dados mínimos
            tituloOtimizado: "Teste Backend OK - Otimizado",
            descricaoOtimizada: "A comunicação básica entre frontend e backend está funcionando!"
        },
        insightsDaIA: [{ // Insight mínimo
            type: "tip",
            title: "Teste de Comunicação",
            description: "O painel conseguiu enviar o link e receber esta resposta do backend.",
            shortTermAction: "Agora, restaure a lógica real no backend.",
            estimatedImpact: "Desbloquear a funcionalidade completa."
        }]
    };

    console.log("Enviando resposta mockada ultra-simplificada...");
    // Adiciona um pequeno delay para simular algum processamento (opcional)
    await new Promise(resolve => setTimeout(resolve, 100)); // Pequeno delay
    res.json(mockUltraSimplificado); // Envia a resposta fixa
});
// =========================================================================
// == FIM DA ROTA SIMPLIFICADA                                            ==
// =========================================================================


// Inicia o servidor para escutar na porta definida
app.listen(PORT, () => {
    console.log(`Servidor backend iniciado e a escutar na porta ${PORT} (Versão de Teste Simplificada)`);
});
