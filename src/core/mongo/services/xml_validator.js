const { XMLParser } = require("fast-xml-parser");
const fs = require('fs');
const path = require('path');

// Carrega o .env (está na raiz, 3 níveis acima desta pasta)
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const validateXML = (xmlString) => {
    return new Promise((resolve, reject) => {
        
        // 1. Verifica se a variável existe no .env
        const envVarPath = process.env.PATH_XSD;
        if (!envVarPath) {
            return reject(new Error('ERRO: Variável PATH_XSD em falta no .env'));
        }

        // 2. Resolve o caminho (ajustado para a tua estrutura real)
        const fullPath = path.resolve(__dirname, '../../../', envVarPath);

        // 3. Verifica se o ficheiro XSD existe (mesmo que não o usemos para validar agora, garante que o caminho está certo)
        if (!fs.existsSync(fullPath)) {
            console.log("Aviso: Ficheiro XSD não encontrado em: " + fullPath);
        }

        // 4. Validação Simplificada (usando fast-xml-parser)
        try {
            const parser = new XMLParser();
            parser.parse(xmlString);
            console.log("XML Validado (Estrutura básica OK)");
            resolve(true);
        } catch (err) {
            reject(new Error(`XML Inválido: ${err.message}`));
        }
    });
};

module.exports = { validateXML };