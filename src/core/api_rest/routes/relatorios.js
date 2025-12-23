const express = require('express');
const router = express.Router();
const Urgencia = require('../../CONSULTAS_AGREGACAO/models/Urgencia');

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