// aiService.js - Versão para chamar o Webhook do N8n

const axios = require('axios');

// ==================================================================
// == URL do Webhook do N8n (Use a URL de PRODUÇÃO na versão final) ==
// ==================================================================
// Usando a URL de teste fornecida por você. Troque pela URL de produção depois.
const URL_N8N_WEBHOOK = 'https://lucaspardal.app.n8n.cloud/webhook/da2b7cb7-418d-490f-8076-b5be40e31b7b';
// ==================================================================

// Se precisar de alguma autenticação para o seu webhook N8n (menos comum para webhooks simples)
// const N8N_AUTH_TOKEN = process.env.N8N_AUTH_TOKEN; 

async function callYourAI(dadosDoProduto) {
    // Verifica se a URL do N8n foi definida
    if (!URL_N8N_WEBHOOK || URL_N8N_WEBHOOK === 'URL_DO_SEU_WEBHOOK_AQUI') { // Verifica o placeholder antigo também
        console.error("ERRO: URL_N8N_WEBHOOK não está definida corretamente em aiService.js");
        throw new Error("A URL do webhook N8n não está configurada no backend.");
    }

    try {
        console.log(`Enviando dados para o Webhook N8n em: ${URL_N8N_WEBHOOK}`);
        const payload = {
            // Estruture o payload como o seu workflow N8n espera receber no nó Webhook.
            // Manter 'dadosParaAnalise' como exemplo, ajuste se necessário no N8n.
            dadosParaAnalise: dadosDoProduto
        };

        const headers = {
            'Content-Type': 'application/json'
            // Adicione cabeçalhos de autenticação se o seu webhook N8n estiver protegido
        };
        // if (N8N_AUTH_TOKEN) {
        //     headers['Authorization'] = `Bearer ${N8N_AUTH_TOKEN}`; 
        // }

        // Faz a chamada POST para o webhook do N8n
        const { data: respostaN8n } = await axios.post(URL_N8N_WEBHOOK, payload, { headers });
        console.log("Resposta recebida do N8n.");

        // === IMPORTANTE: Ajuste esta parte para corresponder à RESPOSTA REAL do seu workflow N8n ===
        // O seu workflow N8n (provavelmente no nó "Respond to Webhook") deve retornar um JSON
        // com as chaves que o frontend espera: tituloGerado, descricaoGerada, listaDeInsights.
        // Adapte os nomes das chaves abaixo ('respostaN8n.tituloGerado', etc.) para os nomes REAIS 
        // que o seu workflow N8n retorna.
        return {
            dadosOtimizados: {
                tituloOtimizado: respostaN8n.tituloGerado || "N8n não retornou título", 
                descricaoOtimizada: respostaN8n.descricaoGerada || "N8n não retornou descrição" 
            },
            insightsDaIA: Array.isArray(respostaN8n.listaDeInsights) ? respostaN8n.listaDeInsights : [] 
        };
        // =========================================================================================

    } catch (error) {
        // Log detalhado do erro da chamada ao N8n
        console.error("Erro ao chamar o Webhook N8n:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        // Lança um novo erro para ser capturado pelo server.js
        throw new Error(`Falha na comunicação com o N8n: ${error.message}`);
    }
}

// Exporta a função para ser usada no server.js
module.exports = { callYourAI };
