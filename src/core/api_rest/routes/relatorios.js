const express = require('express');
const router = express.Router();
const getMediaUtentesEspera = require('../../consultas_agregacao/pipelines/media_espera_urgencia');

/**
 * REQUISITO 1:
 * GET /api/v1/relatorios/urgencia/media-espera
 * Query params esperados: ?inicio=YYYY-MM-DD&fim=YYYY-MM-DD
 */
router.get('/urgencia/media-espera', async (req, res) => {
    try {
        const { inicio, fim } = req.query;

        // Validação básica se as datas existem
        if (!inicio || !fim) {
            return res.status(400).json({ 
                erro: "É necessário fornecer as datas de 'inicio' e 'fim' (formato YYYY-MM-DD)." 
            });
        }

        // Converter strings para objetos Date
        const dataInicio = new Date(inicio);
        const dataFim = new Date(fim);
        // Garantir que a data fim vai até ao último segundo do dia
        dataFim.setHours(23, 59, 59, 999);

        const resultado = await getMediaUtentesEspera(dataInicio, dataFim);
        
        res.json({
            periodo: { desde: inicio, ate: fim },
            total_resultados: resultado.length,
            dados: resultado
        });

    } catch (error) {
        res.status(500).json({ erro: "Erro ao gerar relatório: " + error.message });
    }
});

/**
 * GET /relatorios/espera-atual
 * Retorna os tempos de espera atuais agrupados por hospital
 */
router.get('/espera-atual', async (req, res) => {
    try {
        // Exemplo de agregação básica (podes substituir pelo require das tuas pipelines em .js)
        const relatorio = await Urgencia.aggregate([
            { $sort: { dataRegisto: -1 } },
            { $group: {
                _id: "$hospitalId",
                ultimaAtualizacao: { $first: "$dataRegisto" },
                tempos: { $first: "$detalhes.espera" }
            }}
        ]);
        res.json(relatorio);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao gerar relatório: " + error.message });
    }
});

/**
 * GET /relatorios/status-hospitais
 */
router.get('/status-hospitais', async (req, res) => {
    try {
        const status = await Urgencia.find({}, 'hospitalId detalhes.estado dataRegisto')
                                     .sort({ dataRegisto: -1 });
        res.json(status);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

module.exports = router;