const libxmljs = require('libxmljs2');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * Valida XML contra XSD específico
 * @param {string} xmlString - XML em formato string
 * @param {string} xsdFilename - Nome do ficheiro XSD (ex: 'urgencia.xsd')
 * @returns {Promise} - Resolve se válido, reject se inválido
 */
const validateXML = (xmlString, xsdFilename) => {
    return new Promise((resolve, reject) => {
        try {
            // Verifica se PATH_XSD está definido
            const xsdPath = process.env.PATH_XSD;
            if (!xsdPath) {
                return reject(new Error('Variável PATH_XSD não definida no .env'));
            }

            // Constrói caminho completo para o XSD
            const fullXsdPath = path.resolve(__dirname, '../../../', xsdPath, xsdFilename);

            // Verifica se o ficheiro XSD existe
            if (!fs.existsSync(fullXsdPath)) {
                return reject(new Error(`Ficheiro XSD não encontrado: ${fullXsdPath}`));
            }

            // Lê o conteúdo do XSD
            const xsdContent = fs.readFileSync(fullXsdPath, 'utf-8');

            // Parse do XML e XSD
            const xmlDoc = libxmljs.parseXml(xmlString);
            const xsdDoc = libxmljs.parseXml(xsdContent);

            // Validação contra o schema
            const isValid = xmlDoc.validate(xsdDoc);

            if (isValid) {
                console.log(`✅ XML validado com sucesso contra ${xsdFilename}`);
                resolve(true);
            } else {
                // Captura erros de validação
                const errors = xmlDoc.validationErrors.map(err => err.message).join('; ');
                reject(new Error(`❌ XML inválido: ${errors}`));
            }
        } catch (error) {
            reject(new Error(`Erro na validação XML: ${error.message}`));
        }
    });
};

/**
 * Valida e retorna tipo de documento (urgencia, consulta, cirurgia)
 * @param {string} xmlString 
 * @returns {Promise<string>} - Tipo do documento
 */
const detectXMLType = (xmlString) => {
    return new Promise((resolve, reject) => {
        try {
            const xmlDoc = libxmljs.parseXml(xmlString);
            const rootElement = xmlDoc.root().name();

            // Mapeia elemento raiz para tipo
            const typeMap = {
                'ReportUrgencia': 'urgencia',
                'ReportConsulta': 'consulta',
                'ReportCirurgia': 'cirurgia'
            };

            const type = typeMap[rootElement];
            if (!type) {
                return reject(new Error(`Tipo de documento XML desconhecido: ${rootElement}`));
            }

            resolve(type);
        } catch (error) {
            reject(new Error(`Erro ao detectar tipo XML: ${error.message}`));
        }
    });
};

module.exports = { 
    validateXML,
    detectXMLType
};
