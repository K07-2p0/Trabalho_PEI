const express = require('express');
const router = express.Router();

// Importar as FUNÇÕES das pipelines (NOMES CORRETOS do GitHub)
const { getMediaEsperaUrgencia } = require('../../consultas_agregacao/pipelines/media_espera_urgencia');
const { getPercentagemTriagem } = require('../../consultas_agregacao/pipelines/percentagem_triagem_hospital');
const { getTempoMedioPediatricas } = require('../../consultas_agregacao/pipelines/media_espera_pediatria_regiao');
const { getDiferencaOncologia } = require('../../consultas_agregacao/pipelines/diferenca_tempos_resposta');
const { getTempoMedioCirurgia } = require('../../consultas_agregacao/pipelines/tempo_cirurgia_programada');
const { getDiscrepanciaConsultaCirurgia } = require('../../consultas_agregacao/pipelines/discrepancia_tempos_cirurgiaConsultas');
const { getTopHospitaisPediatria } = require('../../consultas_agregacao/pipelines/top_10_hospitais');
const { getEvolucaoTemporal } = require('../../consultas_agregacao/pipelines/evolucao_temporal');

// ============================================
// QUERY 1: Média de utentes em espera por tipologia
// ============================================
router.get('/media-espera-urgencia', async (req, res) => {
    try {
        const { dataInicio, dataFim, tipologia } = req.query;
        
        if (!dataInicio || !dataFim) {
            return res.status(400).json({ 
                erro: 'Parâmetros dataInicio e dataFim são obrigatórios' 
            });
        }
        
        const resultado = await getMediaEsperaUrgencia(dataInicio, dataFim, tipologia);
        res.json(resultado);
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
});

// ============================================
// QUERY 2: Percentagem por categoria de triagem
// ============================================
router.get('/percentagem-triagem', async (req, res) => {
    try {
        const { hospitalId, dataInicio, dataFim, periodo } = req.query;
        
        if (!hospitalId || !dataInicio || !dataFim) {
            return res.status(400).json({ 
                erro: 'Parâmetros hospitalId, dataInicio e dataFim são obrigatórios' 
            });
        }
        
        const resultado = await getPercentagemTriagem(hospitalId, dataInicio, dataFim, periodo);
        res.json(resultado);
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
});

// ============================================
// QUERY 3: Tempo médio de espera - urgências pediátricas por região
// ============================================
router.get('/tempo-medio-pediatricas', async (req, res) => {
    try {
        const { dataInicio, dataFim, regiao } = req.query;
        
        if (!dataInicio || !dataFim) {
            return res.status(400).json({ 
                erro: 'Parâmetros dataInicio e dataFim são obrigatórios' 
            });
        }
        
        const resultado = await getTempoMedioPediatricas(dataInicio, dataFim, regiao);
        res.json(resultado);
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
});

// ============================================
// QUERY 4: Diferença oncologia vs. não-oncologia
// ============================================
router.get('/diferenca-oncologia', async (req, res) => {
    try {
        const { especialidade, hospitalId, dataInicio, dataFim } = req.query;
        
        if (!especialidade || !dataInicio || !dataFim) {
            return res.status(400).json({ 
                erro: 'Parâmetros especialidade, dataInicio e dataFim são obrigatórios' 
            });
        }
        
        const resultado = await getDiferencaOncologia(especialidade, hospitalId, dataInicio, dataFim);
        res.json(resultado);
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
});

// ============================================
// QUERY 5: Tempo médio de espera para cirurgia programada
// ============================================
router.get('/tempo-medio-cirurgia', async (req, res) => {
    try {
        const { especialidade, dataInicio, dataFim } = req.query;
        
        if (!especialidade || !dataInicio || !dataFim) {
            return res.status(400).json({ 
                erro: 'Parâmetros especialidade, dataInicio e dataFim são obrigatórios' 
            });
        }
        
        const resultado = await getTempoMedioCirurgia(especialidade, dataInicio, dataFim);
        res.json(resultado);
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
});

// ============================================
// QUERY 6: Discrepância consultas vs. cirurgias
// ============================================
router.get('/discrepancia-consulta-cirurgia', async (req, res) => {
    try {
        const { hospitalId, especialidade, dataInicio, dataFim, agregacao } = req.query;
        
        if (!hospitalId || !especialidade || !dataInicio || !dataFim) {
            return res.status(400).json({ 
                erro: 'Parâmetros hospitalId, especialidade, dataInicio e dataFim são obrigatórios' 
            });
        }
        
        const resultado = await getDiscrepanciaConsultaCirurgia(
            hospitalId, 
            especialidade, 
            dataInicio, 
            dataFim, 
            agregacao || 'dia'
        );
        res.json(resultado);
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
});

// ============================================
// QUERY 7: Top 10 hospitais - urgências pediátricas
// ============================================
router.get('/top-hospitais-pediatria', async (req, res) => {
    try {
        const { dataInicio, dataFim, limite } = req.query;
        
        if (!dataInicio || !dataFim) {
            return res.status(400).json({ 
                erro: 'Parâmetros dataInicio e dataFim são obrigatórios' 
            });
        }
        
        const resultado = await getTopHospitaisPediatria(
            dataInicio, 
            dataFim, 
            parseInt(limite) || 10
        );
        res.json(resultado);
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
});

// ============================================
// QUERY 8: Evolução temporal (picos de afluência)
// ============================================
router.get('/evolucao-temporal', async (req, res) => {
    try {
        const { data, hospitalId } = req.query;
        
        if (!data) {
            return res.status(400).json({ 
                erro: 'Parâmetro data é obrigatório (formato: YYYY-MM-DD)' 
            });
        }
        
        const resultado = await getEvolucaoTemporal(data, hospitalId);
        res.json(resultado);
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
});

// ============================================
// Endpoint de teste
// ============================================
router.get('/teste', (req, res) => {
    res.json({ 
        mensagem: 'API de Relatórios funcionando!',
        endpoints_disponiveis: [
            'GET /relatorios/media-espera-urgencia',
            'GET /relatorios/percentagem-triagem',
            'GET /relatorios/tempo-medio-pediatricas',
            'GET /relatorios/diferenca-oncologia',
            'GET /relatorios/tempo-medio-cirurgia',
            'GET /relatorios/discrepancia-consulta-cirurgia',
            'GET /relatorios/top-hospitais-pediatria',
            'GET /relatorios/evolucao-temporal'
        ]
    });
});

module.exports = router;
