// aiService.js - VERSÃO MOCK PARA TESTAR O SCRAPER
// Esta versão NÃO chama o N8n. Ela apenas devolve dados de exemplo
// para que possamos focar em fazer o scraper.js funcionar.

async function callYourAI(dadosDoProduto) {
    console.log("[aiService - MOCK] Recebeu dados do scraper:", JSON.stringify(dadosDoProduto, null, 2));
    console.log("[aiService - MOCK] Devolvendo resposta mockada para o server.js...");

    // Simula a estrutura de resposta que o server.js espera
    return {
        dadosOtimizados: {
            tituloOtimizado: "Título Otimizado (MOCK da IA)",
            descricaoOtimizada: "Descrição Otimizada (MOCK da IA) - Verifique se os dados originais abaixo foram extraídos corretamente pelo scraper."
        },
        insightsDaIA: [
            {
                type: "tip",
                title: "Teste do Scraper",
                description: "Esta é uma resposta mockada do aiService. Os dados originais acima vieram do scraper. Verifique se eles estão corretos.",
                shortTermAction: "Ajustar seletores no scraper.js se necessário.",
                estimatedImpact: "Scraper funcionando 100%!"
            }
        ]
    };
}

module.exports = { callYourAI };
