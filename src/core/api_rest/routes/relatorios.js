const express = require('express');
const router = express.Router();

// Importação das pipelines da pasta pipelines
const getMediaEsperaUrgencia = require('../../consultas_agregacao/pipelines/media_espera_urgencia');
const getMediaEsperaPediatriaRegiao = require('../../consultas_agregacao/pipelines/media_espera_pediatria_regiao');
const getDiferencaTemposResposta = require('../../consultas_agregacao/pipelines/diferenca_tempos_resposta');
const getTempoCirurgiaProgramada = require('../../consultas_agregacao/pipelines/tempo_cirurgia_programada');
const getDiscrepanciaTemposCirurgiaConsultas = require('../../consultas_agregacao/pipelines/discrepancia_tempos_cirurgiaConsultas');
const getTop10Hospitais = require('../../consultas_agregacao/pipelines/top_10_hospitais');
const getEvolucaoTemporal = require('../../consultas_agregacao/pipelines/evolucao_temporal');
const getPercentagemTriagemHospital = require('../../consultas_agregacao/pipelines/percentagem_triagem_hospital');

/**
 * 1. Tempo médio de espera nas urgências pediátricas por região
 * GET /api/relatorios/urgencia/pediatria/regiao?inicio=...&fim=...
 */
router.get('/urgencia/pediatria/regiao', async (req, res) => {
    try {
        const { inicio, fim } = req.query;
        const resultado = await getMediaEsperaPediatriaRegiao(inicio, fim);
        res.json(resultado);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

/**
 * 2. Diferença tempos médios consultas oncologia vs não-oncologia
 * GET /api/relatorios/consultas/diferenca-oncologia?especialidade=...&inicio=...&fim=...
 */
router.get('/consultas/diferenca-oncologia', async (req, res) => {
    try {
        const { especialidade, inicio, fim } = req.query;
        const resultado = await getDiferencaTemposResposta(especialidade, inicio, fim);
        res.json(resultado);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

/**
 * 3. Tempo médio cirurgia programada (Geral vs Oncológica)
 * GET /api/relatorios/cirurgia/tempo-medio?mes=...&ano=...
 */
router.get('/cirurgia/tempo-medio', async (req, res) => {
    try {
        const { mes, ano } = req.query;
        const resultado = await getTempoCirurgiaProgramada(parseInt(mes), parseInt(ano));
        res.json(resultado);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

/**
 * 4. Discrepância tempos de resposta Consultas vs Cirurgias
 * GET /api/relatorios/discrepancia?granularidade=dia&inicio=...&fim=...
 */
router.get('/discrepancia', async (req, res) => {
    try {
        const { granularidade, inicio, fim } = req.query;
        const resultado = await getDiscrepanciaTemposCirurgiaConsultas(granularidade, inicio, fim);
        res.json(resultado);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

/**
 * 5. Top 10 Hospitais com menores tempos em pediatria
 * GET /api/relatorios/rankings/top-10-pediatria?inicio=...&fim=...
 */
router.get('/rankings/top-10-pediatria', async (req, res) => {
    try {
        const { inicio, fim } = req.query;
        const resultado = await getTop10Hospitais(inicio, fim);
        res.json(resultado);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

/**
 * 6. Evolução temporal (15 em 15 min) e picos de afluência
 * GET /api/relatorios/urgencia/evolucao?data=YYYY-MM-DD
 */
router.get('/urgencia/evolucao', async (req, res) => {
    try {
        const { data } = req.query;
        const resultado = await getEvolucaoTemporal(data);
        res.json(resultado);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

/**
 * 7. Percentagem de triagem por hospital
 * GET /api/relatorios/urgencia/percentagem-triagem?hospital_id=...
 */
router.get('/urgencia/percentagem-triagem', async (req, res) => {
    try {
        const { hospital_id } = req.query;
        const resultado = await getPercentagemTriagemHospital(hospital_id);
        res.json(resultado);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

/**
 * 8. Média geral de espera nas urgências
 */
router.get('/urgencia/media-espera', async (req, res) => {
    try {
        const { inicio, fim } = req.query;
        const resultado = await getMediaEsperaUrgencia(inicio, fim);
        res.json(resultado);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

/**
 * 9. Estatísticas de erros de integração
 * GET /api/relatorios/estatisticas-erros
 */
router.get('/estatisticas-erros', async (req, res) => {
    try {
        const ErroIntegracao = require('../../consultas_agregacao/models/ErroIntegracao');

        const stats = await ErroIntegracao.aggregate([
            {
                $group: {
                    _id: '$tipo',
                    total: { $sum: 1 },
                    naoResolvidos: { 
                        $sum: { $cond: [{ $eq: ['$resolvido', false] }, 1, 0] }
                    },
                    resolvidos: { 
                        $sum: { $cond: [{ $eq: ['$resolvido', true] }, 1, 0] }
                    }
                }
            },
            {
                $sort: { total: -1 }
            }
        ]);

        const totalGeral = await ErroIntegracao.countDocuments();
        const naoResolvidosGeral = await ErroIntegracao.countDocuments({ resolvido: false });

        res.json({
            sucesso: true,
            totalErros: totalGeral,
            errosNaoResolvidos: naoResolvidosGeral,
            porTipo: stats
        });
    } catch (error) {
        res.status(500).json({ 
            sucesso: false,
            erro: error.message 
        });
    }
});

module.exports = router;