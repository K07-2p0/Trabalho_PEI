// 32_INTEGRACAO_MONGO/services/xml_validator.js
const xsd = require('libxml-xsd');
const fs = require('fs');
const path = require('path');

// Caminho para o ficheiro XSD (ajusta o caminho conforme a tua estrutura real)
const XSD_PATH = path.join(__dirname, '../../20_DADOS_VOCABULARIO/21_XSD/HealthTime_Vocabulario.xsd');

/**
 * Valida uma string XML contra o Schema XSD definido.
 * @param {string} xmlString - O conteúdo do XML a validar.
 * @returns {Promise<boolean>} - Retorna true se válido, ou lança erro com detalhes.
 */
const validateXML = (xmlString) => {
    return new Promise((resolve, reject) => {
        // Verifica se o XSD existe
        if (!fs.existsSync(XSD_PATH)) {
            return reject(new Error(`Ficheiro XSD não encontrado em: ${XSD_PATH}`));
        }

        xsd.parseFile(XSD_PATH, (err, schema) => {
            if (err) return reject(new Error('Erro ao carregar XSD: ' + err.message));

            schema.validate(xmlString, (validationErrors) => {
                if (validationErrors) {
                    // Formata os erros para serem mais legíveis
                    const errorMessages = validationErrors.map(e => e.message).join('; ');
                    return reject(new Error(`XML Inválido: ${errorMessages}`));
                }
                // Se não houver erros
                resolve(true);
            });
        });
    });
};

module.exports = { validateXML };