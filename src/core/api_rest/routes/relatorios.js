const express = require('express');
const router = express.Router();

// Importação das pipelines da pasta pipelines
const getMediaUtentesEspera = require('../../consultas_agregacao/pipelines/media_espera_urgencia');
const getMediaEsperaPediatriaRegiao = require('../../consultas_agregacao/pipelines/media_espera_pediatria_regiao');
const getDiferencaTemposResposta = require('../../consultas_agregacao/pipelines/diferenca_tempos_resposta');
const getTempoCirurgiaProgramada = require('../../consultas_agregacao/pipelines/tempo_cirurgia_programada');
const getDiscrepanciaTemposCirurgiaConsultas = require('../../consultas_agregacao/pipelines/discrepancia_tempos_cirurgiaConsultas');
const getTop10Hospitais = require('../../consultas_agregacao/pipelines/top_10_hospitais');
const getEvolucaoTemporal = require('../../consultas_agregacao/pipelines/evolucao_temporal');
const getPercentagemTriagemHospital = require('../../consultas_agregacao/pipelines/percentagem_triagem_hospital');

/**
 * 1. Média de utentes em espera por tipologia
 * GET /relatorios/urgencia/media-espera?inicio=2025-02-01&fim=2025-02-28
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
            periodo: {
                desde: inicio,
                ate: fim
            },
            total_resultados: resultado.length,
            dados: resultado
        });
    } catch (error) {
        res.status(500).json({
            erro: "Erro ao gerar relatório: " + error.message
        });
    }
});

/**
 * 2. Tempo médio de espera nas urgências pediátricas por região
 * GET /relatorios/urgencia/pediatria/regiao?inicio=...&fim=...
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
 * 3. Diferença tempos médios consultas oncologia vs não-oncologia
 * GET /relatorios/consultas/diferenca-oncologia?especialidade=...&inicio=...&fim=...
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
 * 4. Tempo médio cirurgia programada (Geral vs Oncológica)
 * GET /relatorios/cirurgia/tempo-medio?mes=...&ano=...
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
 * 5. Discrepância tempos de resposta Consultas vs Cirurgias
 * GET /relatorios/discrepancia?granularidade=dia&inicio=...&fim=...
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
 * 6. Top 10 Hospitais com menores tempos em pediatria
 * GET /relatorios/rankings/top-10-pediatria?inicio=...&fim=...
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
 * 7. Evolução temporal (15 em 15 min) e picos de afluência
 * GET /relatorios/urgencia/evolucao?data=YYYY-MM-DD
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
 * 8. Percentagem de triagem por hospital
 * GET /relatorios/urgencia/percentagem-triagem?hospital_id=...
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


module.exports = router;
