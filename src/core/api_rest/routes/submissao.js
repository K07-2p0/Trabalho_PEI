const express = require('express');
const router = express.Router();
const xmlValidator = require('../../mongo/services/xml_validator');
const dataTransformer = require('../../mongo/services/data_transformer');

// Importação dos Modelos Mongoose
const Urgencia = require('../../consultas_agregacao/models/Urgencia');
const Consulta = require('../../consultas_agregacao/models/ConsultaCirurgia');

/**
 * POST /submissao/urgencia
 * Recebe XML de urgência, valida e guarda no MongoDB
 */
router.post('/urgencia', async (req, res) => {
    try {
        const xmlData = req.body;
        if (!xmlData) return res.status(400).json({ erro: "Corpo do pedido vazio." });

        // 1. Validação XSD
        await validateXML(xmlData);

        // 2. Transformação para JSON (usa a lógica do teu data_transformer.js)
        const jsonData = await transformUrgencia(xmlData);

        // 3. Persistência no MongoDB
        const novoRegisto = new Urgencia(jsonData);
        await novoRegisto.save();

        res.status(201).json({ 
            mensagem: "Dados de Urgência integrados com sucesso!", 
            id: novoRegisto._id 
        });
    } catch (error) {
        res.status(400).json({ erro: error.message });
    }
});

/**
 * POST /submissao/consulta
 */
router.post('/consulta', async (req, res) => {
    try {
        const xmlData = req.body;
        await validateXML(xmlData);
        const jsonData = await transformConsulta(xmlData);

        const novoRegisto = new Consulta(jsonData);
        await novoRegisto.save();

        res.status(201).json({ mensagem: "Dados de Consulta integrados!" });
    } catch (error) {
        res.status(400).json({ erro: error.message });
    }
});

module.exports = router;