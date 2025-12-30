const express = require('express');
const router = express.Router();
const { validateXML, detectXMLType } = require('../../mongo/services/xml_validator');
const { 
    transformUrgencia, 
    transformConsulta, 
    transformCirurgia 
} = require('../../mongo/services/data_transformer');

// Modelos Mongoose
const Urgencia = require('../../consultas_agregacao/models/Urgencia');
const ConsultaCirurgia = require('../../consultas_agregacao/models/ConsultaCirurgia');
const ErroIntegracao = require('../../consultas_agregacao/models/ErroIntegracao');

/**
 * Função auxiliar para registar erros na BD
 */
const registarErro = async (tipo, mensagem, xmlOriginal = null, detalhes = null) => {
    try {
        const erro = new ErroIntegracao({
            tipo: tipo,
            mensagemErro: mensagem,
            xmlOriginal: xmlOriginal,
            detalhesErro: detalhes
        });
        await erro.save();
        console.log(`Erro registado: ${tipo} - ${mensagem}`);
    } catch (err) {
        console.error('Erro ao registar erro na BD:', err.message);
    }
};

/**
 * POST /submissao/urgencia
 * Recebe XML de urgência, valida, transforma e guarda no MongoDB
 */
router.post('/urgencia', async (req, res) => {
    const xmlString = req.body;
    
    try {
        // 1. Validação básica
        if (!xmlString || xmlString.trim() === '') {
            throw new Error('Corpo do pedido vazio');
        }

        // 2. Validação XSD
        await validateXML(xmlString, 'urgencia.xsd');

        // 3. Transformação XML → JSON
        const jsonData = await transformUrgencia(xmlString);

        // 4. Persistência no MongoDB
        const novoRegisto = new Urgencia(jsonData);
        await novoRegisto.save();

        res.status(201).json({ 
            sucesso: true,
            mensagem: "Dados de Urgência integrados com sucesso!", 
            id: novoRegisto._id,
            hospitalId: jsonData.hospitalId,
            dataRegisto: jsonData.dataRegisto
        });

    } catch (error) {
        // Determina tipo de erro
        let tipoErro = 'validacao';
        if (error.message.includes('transformação')) {
            tipoErro = 'transformacao';
        } else if (error.message.includes('save') || error.message.includes('MongoDB')) {
            tipoErro = 'persistencia';
        }

        // Regista erro na coleção de erros
        await registarErro(
            'urgencia',
            error.message,
            xmlString,
            { tipoErro: tipoErro, stack: error.stack }
        );

        res.status(400).json({ 
            sucesso: false,
            erro: error.message,
            tipo: tipoErro
        });
    }
});

/**
 * POST /submissao/consulta
 * Recebe XML de consultas
 */
router.post('/consulta', async (req, res) => {
    const xmlString = req.body;
    
    try {
        if (!xmlString || xmlString.trim() === '') {
            throw new Error('Corpo do pedido vazio');
        }

        // Validação XSD
        await validateXML(xmlString, 'consulta.xsd');

        // Transformação
        const jsonData = await transformConsulta(xmlString);

        // Persistência
        const novoRegisto = new ConsultaCirurgia(jsonData);
        await novoRegisto.save();

        res.status(201).json({ 
            sucesso: true,
            mensagem: "Dados de Consultas integrados com sucesso!", 
            id: novoRegisto._id,
            hospitalId: jsonData.hospitalId,
            periodo: `${jsonData.mesReferencia}/${jsonData.anoReferencia}`
        });

    } catch (error) {
        let tipoErro = 'validacao';
        if (error.message.includes('transformação')) tipoErro = 'transformacao';
        else if (error.message.includes('save')) tipoErro = 'persistencia';

        await registarErro('consulta', error.message, xmlString, { tipoErro: tipoErro });

        res.status(400).json({ 
            sucesso: false,
            erro: error.message,
            tipo: tipoErro
        });
    }
});

/**
 * POST /submissao/cirurgia
 * Recebe XML de cirurgias
 */
router.post('/cirurgia', async (req, res) => {
    const xmlString = req.body;
    
    try {
        if (!xmlString || xmlString.trim() === '') {
            throw new Error('Corpo do pedido vazio');
        }

        // Validação XSD
        await validateXML(xmlString, 'cirurgia.xsd');

        // Transformação
        const jsonData = await transformCirurgia(xmlString);

        // Persistência
        const novoRegisto = new ConsultaCirurgia(jsonData);
        await novoRegisto.save();

        res.status(201).json({ 
            sucesso: true,
            mensagem: "Dados de Cirurgias integrados com sucesso!", 
            id: novoRegisto._id,
            hospitalId: jsonData.hospitalId,
            periodo: `${jsonData.mesReferencia}/${jsonData.anoReferencia}`
        });

    } catch (error) {
        let tipoErro = 'validacao';
        if (error.message.includes('transformação')) tipoErro = 'transformacao';
        else if (error.message.includes('save')) tipoErro = 'persistencia';

        await registarErro('cirurgia', error.message, xmlString, { tipoErro: tipoErro });

        res.status(400).json({ 
            sucesso: false,
            erro: error.message,
            tipo: tipoErro
        });
    }
});

/**
 * POST /submissao/auto
 * Endpoint inteligente que detecta o tipo de XML automaticamente
 */
router.post('/auto', async (req, res) => {
    const xmlString = req.body;
    
    try {
        if (!xmlString || xmlString.trim() === '') {
            throw new Error('Corpo do pedido vazio');
        }

        // Detecta tipo de documento
        const tipo = await detectXMLType(xmlString);
        
        // Mapeia tipo para XSD e função de transformação
        const config = {
            'urgencia': { xsd: 'urgencia.xsd', transform: transformUrgencia, model: Urgencia },
            'consulta': { xsd: 'consulta.xsd', transform: transformConsulta, model: ConsultaCirurgia },
            'cirurgia': { xsd: 'cirurgia.xsd', transform: transformCirurgia, model: ConsultaCirurgia }
        };

        const cfg = config[tipo];

        // Validação, transformação e persistência
        await validateXML(xmlString, cfg.xsd);
        const jsonData = await cfg.transform(xmlString);
        const novoRegisto = new cfg.model(jsonData);
        await novoRegisto.save();

        res.status(201).json({ 
            sucesso: true,
            mensagem: `Dados de ${tipo} integrados com sucesso!`,
            tipo: tipo,
            id: novoRegisto._id
        });

    } catch (error) {
        await registarErro('auto', error.message, xmlString, { stack: error.stack });

        res.status(400).json({ 
            sucesso: false,
            erro: error.message
        });
    }
});

/**
 * GET /submissao/erros
 * Lista erros de integração (não resolvidos por defeito)
 */
router.get('/erros', async (req, res) => {
    try {
        const { resolvido = false, tipo, limite = 50 } = req.query;
        
        const filtro = {};
        if (resolvido !== undefined) filtro.resolvido = resolvido === 'true';
        if (tipo) filtro.tipo = tipo;

        const erros = await ErroIntegracao.find(filtro)
            .sort({ dataOcorrencia: -1 })
            .limit(parseInt(limite))
            .select('-xmlOriginal');

        res.json({
            sucesso: true,
            total: erros.length,
            erros: erros
        });
    } catch (error) {
        res.status(500).json({ 
            sucesso: false,
            erro: error.message 
        });
    }
});

/**
 * GET /submissao/erros/:id
 * Obter detalhes de um erro específico (incluindo XML)
 */
router.get('/erros/:id', async (req, res) => {
    try {
        const erro = await ErroIntegracao.findById(req.params.id);
        
        if (!erro) {
            return res.status(404).json({ 
                sucesso: false,
                erro: 'Erro não encontrado' 
            });
        }

        res.json({
            sucesso: true,
            erro: erro
        });
    } catch (error) {
        res.status(500).json({ 
            sucesso: false,
            erro: error.message 
        });
    }
});

/**
 * PATCH /submissao/erros/:id/resolver
 * Marca um erro como resolvido
 */
router.patch('/erros/:id/resolver', async (req, res) => {
    try {
        const { observacoes } = req.body;

        const erro = await ErroIntegracao.findByIdAndUpdate(
            req.params.id,
            { 
                resolvido: true,
                dataResolucao: new Date(),
                observacoes: observacoes || ''
            },
            { new: true }
        );

        if (!erro) {
            return res.status(404).json({ 
                sucesso: false,
                erro: 'Erro não encontrado' 
            });
        }

        res.json({
            sucesso: true,
            mensagem: 'Erro marcado como resolvido',
            erro: erro
        });
    } catch (error) {
        res.status(500).json({ 
            sucesso: false,
            erro: error.message 
        });
    }
});

module.exports = router;