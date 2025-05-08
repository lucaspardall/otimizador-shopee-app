// aiService.js
const axios = require('axios');

// IMPORTANTE: Substitua pela URL real do webhook da sua IA
const URL_WEBHOOK_IA = 'URL_DO_SEU_WEBHOOK_DA_IA_AQUI';
// Se sua IA precisar de uma chave de API, configure-a como variável de ambiente
const API_KEY_IA = process.env.IA_API_KEY; // Exemplo

async function callYourAI(dadosDoProduto) {
    try {
        console.log("Enviando dados para a IA...");
        const payload = {
            // Estruture o payload conforme sua IA espera
            // Exemplo baseado no que o frontend espera de volta (para a IA gerar)
            dadosParaAnalise: dadosDoProduto
        };

        const headers = {
            'Content-Type': 'application/json'
        };
        if (API_KEY_IA) {
            headers['Authorization'] = `Bearer ${API_KEY_IA}`; // Ou outro esquema de autenticação
        }

        const { data: respostaIA } = await axios.post(URL_WEBHOOK_IA, payload, { headers });
        console.log("Resposta recebida da IA.");

        // Supondo que sua IA retorne um objeto com:
        // tituloOtimizado, descricaoOtimizada, insightsDaIA (array de objetos)
        return {
            dadosOtimizados: {
                tituloOtimizado: respostaIA.tituloOtimizado || "IA não retornou título",
                descricaoOtimizada: respostaIA.descricaoOtimizada || "IA não retornou descrição"
            },
            insightsDaIA: respostaIA.insightsDaIA || []
        };

    } catch (error) {
        console.error("Erro ao chamar a IA:", error.response ? error.response.data : error.message);
        throw new Error(`Falha na comunicação com a IA: ${error.message}`);
    }
}

module.exports = { callYourAI };