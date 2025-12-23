// CODIGO_FONTE/INTEGRACAO_MONGO/services/xml_validator.js
const xsd = require('libxml-xsd');
const fs = require('fs');
const path = require('path');

// Carrega o .env (recuando 3 pastas até à raiz)
require('dotenv').config({ path: path.join(__dirname, '.env') });

const validateXML = (xmlString) => {
    return new Promise((resolve, reject) => {
        
        // 1. Ler o caminho relativo do ficheiro .env (ex: ./DADOS_VOCABULARIO/...)
        const relativePathFromEnv = process.env.PATH_XSD;

        if (!relativePathFromEnv) {
            return reject(new Error('ERRO: PATH_XSD não definido no .env'));
        }

        // 2. Construir o caminho dinamicamente
        // __dirname = pasta atual (services)
        // ../../../ = volta à raiz do projeto (Trabalho_PEI)
        // relativePathFromEnv = o caminho que definiste no .env
        const fullPath = path.join(__dirname, '../../../', relativePathFromEnv);

        // 3. Verificar existência
        if (!fs.existsSync(fullPath)) {
            // Mostra o caminho que tentou aceder para ajudar a debuggar
            return reject(new Error(`XSD não encontrado. O código tentou aceder a: ${fullPath}`));
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