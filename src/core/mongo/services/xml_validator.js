// CODIGO_FONTE/INTEGRACAO_MONGO/services/xml_validator.js
const xsd = require('libxml-xsd');
const fs = require('fs');
const path = require('path');

// Carrega o .env (3 níveis acima)
require('dotenv').config({ path: path.join(__dirname, '.env') });

const validateXML = (xmlString) => {
    return new Promise((resolve, reject) => {
        
        // 1. Chama a variável do .env
        const envVarPath = process.env.PATH_XSD;

        if (!envVarPath) {
            return reject(new Error('ERRO: Variável PATH_XSD em falta no .env'));
        }

        // 2. Resolver o caminho absoluto
        // NOTA: Como o teu caminho no .env começa por "./Trabalho_PEI/", 
        // temos de recuar 4 níveis (até ao pai da pasta Trabalho_PEI) para o caminho bater certo.
        const fullPath = path.join(__dirname, '../../../../', envVarPath);

        // 3. Verificar existência
        if (!fs.existsSync(fullPath)) {
            return reject(new Error(`XSD não encontrado no caminho: ${fullPath}`));
        }

        // 4. Validar
        xsd.parseFile(fullPath, (err, schema) => {
            if (err) return reject(new Error('Erro ao processar XSD: ' + err.message));

            schema.validate(xmlString, (validationErrors) => {
                if (validationErrors) {
                    const errorMessages = validationErrors.map(e => e.message).join('; ');
                    return reject(new Error(`XML Inválido: ${errorMessages}`));
                }
                resolve(true);
            });
        });
    });
};

module.exports = { validateXML };