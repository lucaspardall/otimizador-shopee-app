// aiService.js
const axios = require('axios');

// IMPORTANTE: Substitua pela URL real do webhook da sua IA
// Se estiver usando N8n, esta será a URL do seu Webhook Trigger no N8n.
const URL_WEBHOOK_IA = 'URL_DO_SEU_WEBHOOK_DA_IA_AQUI'; 
// Se sua IA precisar de uma chave de API ou outra autenticação, configure aqui ou via variáveis de ambiente
const API_KEY_IA = process.env.IA_API_KEY; // Exemplo usando variável de ambiente

async function callYourAI(dadosDoProduto) {
    try {
        console.log("Enviando dados para a IA...");
        const payload = {
            // Estruture o payload EXATAMENTE como sua IA (N8n) espera receber.
            // O nome 'dadosParaAnalise' é só um exemplo.
            dadosParaAnalise: dadosDoProduto 
        };

        const headers = {
            'Content-Type': 'application/json'
            // Adicione outros cabeçalhos se sua IA precisar (ex: autenticação)
        };
        if (API_KEY_IA) {
            // Adapte o esquema de autenticação se necessário (ex: 'X-Api-Key', etc.)
            headers['Authorization'] = `Bearer ${API_KEY_IA}`; 
        }

        // Faz a chamada POST para o webhook da sua IA
        const { data: respostaIA } = await axios.post(URL_WEBHOOK_IA, payload, { headers });
        console.log("Resposta recebida da IA.");

        // === IMPORTANTE: Ajuste esta parte para corresponder à RESPOSTA REAL da sua IA ===
        // Supondo que sua IA retorne um objeto JSON com chaves como estas:
        // {
        //   "tituloGerado": "...",
        //   "descricaoGerada": "...",
        //   "listaDeInsights": [ { "tipo": "...", "titulo": "...", ... }, ... ] 
        // }
        // Adapte os nomes das chaves abaixo ('respostaIA.tituloGerado', etc.) para os nomes REAIS que sua IA retorna.
        return {
            dadosOtimizados: {
                tituloOtimizado: respostaIA.tituloGerado || "IA não retornou título", // Exemplo: usar 'tituloGerado'
                descricaoOtimizada: respostaIA.descricaoGerada || "IA não retornou descrição" // Exemplo: usar 'descricaoGerada'
            },
            // Adapte 'respostaIA.listaDeInsights' para o nome REAL do array de insights retornado pela IA
            insightsDaIA: Array.isArray(respostaIA.listaDeInsights) ? respostaIA.listaDeInsights : [] 
        };
        // =================================================================================

    } catch (error) {
        // Log detalhado do erro da IA
        console.error("Erro ao chamar a IA:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        // Lança um novo erro para ser capturado pelo server.js
        throw new Error(`Falha na comunicação com a IA: ${error.message}`);
    }
}

// Exporta a função para ser usada no server.js
module.exports = { callYourAI };
