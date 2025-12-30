const { XMLParser, XMLValidator } = require('fast-xml-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * Valida estrutura básica do XML
 */
const validateXMLStructure = (xmlString) => {
    const result = XMLValidator.validate(xmlString, {
        allowBooleanAttributes: true
    });
    
    if (result !== true) {
        throw new Error(`XML mal formado: ${result.err.msg} na linha ${result.err.line}`);
    }
    
    return true;
};

/**
 * Valida XML de Urgência contra regras de negócio
 */
const validateUrgenciaRules = (xmlObj) => {
    const dados = xmlObj.ReportUrgencia;
    
    if (!dados) {
        throw new Error('Elemento raiz ReportUrgencia não encontrado');
    }
    
    // Validação do Cabeçalho
    if (!dados.Cabecalho) {
        throw new Error('Elemento Cabecalho obrigatório');
    }
    if (!dados.Cabecalho.HospitalID || dados.Cabecalho.HospitalID.trim() === '') {
        throw new Error('HospitalID obrigatório no Cabecalho');
    }
    if (!dados.Cabecalho.DataHora) {
        throw new Error('DataHora obrigatório no Cabecalho');
    }
    
    // Validação da Data
    const data = new Date(dados.Cabecalho.DataHora);
    if (isNaN(data.getTime())) {
        throw new Error('DataHora inválida no formato ISO 8601');
    }
    
    // Validação de Tipologia
    if (!dados.Tipologia) {
        throw new Error('Elemento Tipologia obrigatório');
    }
    const tipologiasValidas = ['Geral', 'Pediátrica', 'Obstétrica', 'Médico-Cirúrgica', 'Polivalente'];
    if (!tipologiasValidas.includes(dados.Tipologia)) {
        throw new Error(`Tipologia inválida. Valores aceites: ${tipologiasValidas.join(', ')}`);
    }
    
    // Validação de Estado
    if (!dados.EstadoServico) {
        throw new Error('Elemento EstadoServico obrigatório');
    }
    if (!['Aberta', 'Fechada'].includes(dados.EstadoServico)) {
        throw new Error('EstadoServico deve ser "Aberta" ou "Fechada"');
    }
    
    // Validação de Morada
    if (!dados.Morada || dados.Morada.trim() === '') {
        throw new Error('Elemento Morada obrigatório');
    }
    
    // Validação de Espera
    if (dados.Espera && dados.Espera.Item) {
        const items = Array.isArray(dados.Espera.Item) ? dados.Espera.Item : [dados.Espera.Item];
        const triagensValidas = ['Emergente', 'Muito Urgente', 'Urgente', 'Pouco Urgente', 'Não Urgente'];
        
        items.forEach((item, index) => {
            if (!item.CorTriagem) {
                throw new Error(`Item ${index} em Espera: CorTriagem obrigatória`);
            }
            if (!triagensValidas.includes(item.CorTriagem)) {
                throw new Error(`Item ${index} em Espera: CorTriagem inválida. Valores aceites: ${triagensValidas.join(', ')}`);
            }
            if (item.NumeroUtentes === undefined || item.NumeroUtentes === null) {
                throw new Error(`Item ${index} em Espera: NumeroUtentes obrigatório`);
            }
            if (isNaN(parseInt(item.NumeroUtentes)) || parseInt(item.NumeroUtentes) < 0) {
                throw new Error(`Item ${index} em Espera: NumeroUtentes deve ser número >= 0`);
            }
            if (item.TempoEspera !== undefined && (isNaN(parseInt(item.TempoEspera)) || parseInt(item.TempoEspera) < 0)) {
                throw new Error(`Item ${index} em Espera: TempoEspera deve ser número >= 0`);
            }
        });
    }
    
    // Validação de Observação
    if (dados.Observacao && dados.Observacao.Item) {
        const items = Array.isArray(dados.Observacao.Item) ? dados.Observacao.Item : [dados.Observacao.Item];
        const triagensValidas = ['Emergente', 'Muito Urgente', 'Urgente', 'Pouco Urgente', 'Não Urgente'];
        
        items.forEach((item, index) => {
            if (!item.CorTriagem) {
                throw new Error(`Item ${index} em Observacao: CorTriagem obrigatória`);
            }
            if (!triagensValidas.includes(item.CorTriagem)) {
                throw new Error(`Item ${index} em Observacao: CorTriagem inválida`);
            }
            if (item.NumeroUtentes === undefined) {
                throw new Error(`Item ${index} em Observacao: NumeroUtentes obrigatório`);
            }
            if (isNaN(parseInt(item.NumeroUtentes)) || parseInt(item.NumeroUtentes) < 0) {
                throw new Error(`Item ${index} em Observacao: NumeroUtentes deve ser número >= 0`);
            }
        });
    }
    
    return true;
};

/**
 * Valida XML de Consulta contra regras de negócio
 */
const validateConsultaRules = (xmlObj) => {
    const dados = xmlObj.ReportConsulta;
    
    if (!dados) {
        throw new Error('Elemento raiz ReportConsulta não encontrado');
    }
    
    // Validação do Cabeçalho
    if (!dados.Cabecalho) {
        throw new Error('Elemento Cabecalho obrigatório');
    }
    if (!dados.Cabecalho.HospitalID || dados.Cabecalho.HospitalID.trim() === '') {
        throw new Error('HospitalID obrigatório no Cabecalho');
    }
    if (!dados.Cabecalho.Periodo) {
        throw new Error('Periodo obrigatório no Cabecalho (formato: YYYY-MM)');
    }
    
    // Validação do Período (formato YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(dados.Cabecalho.Periodo)) {
        throw new Error('Periodo deve estar no formato YYYY-MM (ex: 2025-01)');
    }
    
    // Validação de Especialidades
    if (!dados.ListaEspecialidades || !dados.ListaEspecialidades.Especialidade) {
        throw new Error('ListaEspecialidades com pelo menos uma Especialidade é obrigatória');
    }
    
    const specs = Array.isArray(dados.ListaEspecialidades.Especialidade) 
        ? dados.ListaEspecialidades.Especialidade 
        : [dados.ListaEspecialidades.Especialidade];
    
    const populacoesValidas = ['Adulto', 'Criança', 'Ambos'];
    const listasValidas = ['Geral', 'Não-Oncológica', 'Oncológica'];
    
    specs.forEach((esp, index) => {
        if (!esp.Nome || esp.Nome.trim() === '') {
            throw new Error(`Especialidade ${index}: Nome obrigatório`);
        }
        if (!esp.PopulacaoAlvo) {
            throw new Error(`Especialidade ${index}: PopulacaoAlvo obrigatório`);
        }
        if (!populacoesValidas.includes(esp.PopulacaoAlvo)) {
            throw new Error(`Especialidade ${index}: PopulacaoAlvo inválido. Valores aceites: ${populacoesValidas.join(', ')}`);
        }
        if (!esp.TipoLista) {
            throw new Error(`Especialidade ${index}: TipoLista obrigatório`);
        }
        if (!listasValidas.includes(esp.TipoLista)) {
            throw new Error(`Especialidade ${index}: TipoLista inválido. Valores aceites: ${listasValidas.join(', ')}`);
        }
        
        // Validação dos Tempos de Resposta
        ['TempoMuitoPrioritario', 'TempoPrioritario', 'TempoNormal'].forEach(campo => {
            if (esp[campo] === undefined) {
                throw new Error(`Especialidade ${index}: ${campo} obrigatório`);
            }
            if (isNaN(parseInt(esp[campo])) || parseInt(esp[campo]) < 0) {
                throw new Error(`Especialidade ${index}: ${campo} deve ser número >= 0 (dias)`);
            }
        });
    });
    
    return true;
};

/**
 * Valida XML de Cirurgia contra regras de negócio
 */
const validateCirurgiaRules = (xmlObj) => {
    const dados = xmlObj.ReportCirurgia;
    
    if (!dados) {
        throw new Error('Elemento raiz ReportCirurgia não encontrado');
    }
    
    // Validação do Cabeçalho
    if (!dados.Cabecalho) {
        throw new Error('Elemento Cabecalho obrigatório');
    }
    if (!dados.Cabecalho.HospitalID || dados.Cabecalho.HospitalID.trim() === '') {
        throw new Error('HospitalID obrigatório no Cabecalho');
    }
    if (!dados.Cabecalho.Periodo) {
        throw new Error('Periodo obrigatório no Cabecalho (formato: YYYY-MM)');
    }
    
    // Validação do Período
    if (!/^\d{4}-\d{2}$/.test(dados.Cabecalho.Periodo)) {
        throw new Error('Periodo deve estar no formato YYYY-MM (ex: 2025-01)');
    }
    
    // Validação de Especialidades
    if (!dados.ListaEspecialidades || !dados.ListaEspecialidades.Especialidade) {
        throw new Error('ListaEspecialidades com pelo menos uma Especialidade é obrigatória');
    }
    
    const specs = Array.isArray(dados.ListaEspecialidades.Especialidade) 
        ? dados.ListaEspecialidades.Especialidade 
        : [dados.ListaEspecialidades.Especialidade];
    
    const listasValidas = ['Geral', 'Não-Oncológica', 'Oncológica'];
    
    specs.forEach((esp, index) => {
        if (!esp.Nome || esp.Nome.trim() === '') {
            throw new Error(`Especialidade ${index}: Nome obrigatório`);
        }
        if (!esp.TipoLista) {
            throw new Error(`Especialidade ${index}: TipoLista obrigatório`);
        }
        if (!listasValidas.includes(esp.TipoLista)) {
            throw new Error(`Especialidade ${index}: TipoLista inválido. Valores aceites: ${listasValidas.join(', ')}`);
        }
        if (esp.TempoEspera === undefined) {
            throw new Error(`Especialidade ${index}: TempoEspera obrigatório`);
        }
        if (isNaN(parseFloat(esp.TempoEspera)) || parseFloat(esp.TempoEspera) < 0) {
            throw new Error(`Especialidade ${index}: TempoEspera deve ser número >= 0 (dias)`);
        }
        if (esp.NumeroCirurgias !== undefined && (isNaN(parseInt(esp.NumeroCirurgias)) || parseInt(esp.NumeroCirurgias) < 0)) {
            throw new Error(`Especialidade ${index}: NumeroCirurgias deve ser número >= 0`);
        }
    });
    
    return true;
};

/**
 * Valida XML contra XSD (usando regras de negócio customizadas)
 * @param {string} xmlString - XML em formato string
 * @param {string} xsdFilename - Nome do ficheiro XSD
 * @returns {Promise} - Resolve se válido, reject se inválido
 */
const validateXML = (xmlString, xsdFilename) => {
    return new Promise((resolve, reject) => {
        try {
            // 1. Validação estrutural básica
            validateXMLStructure(xmlString);
            
            // 2. Parse do XML para objeto
            const parser = new XMLParser({
                ignoreAttributes: false,
                parseAttributeValue: true,
                parseTagValue: true,
                trimValues: true
            });
            
            const xmlObj = parser.parse(xmlString);
            
            // 3. Validação de regras de negócio baseada no tipo
            if (xsdFilename === 'urgencia.xsd') {
                validateUrgenciaRules(xmlObj);
            } else if (xsdFilename === 'consulta.xsd') {
                validateConsultaRules(xmlObj);
            } else if (xsdFilename === 'cirurgia.xsd') {
                validateCirurgiaRules(xmlObj);
            } else {
                throw new Error(`XSD desconhecido: ${xsdFilename}`);
            }
            
            console.log(`XML validado com sucesso contra ${xsdFilename}`);
            resolve(true);
            
        } catch (error) {
            reject(new Error(`XML inválido: ${error.message}`));
        }
    });
};

/**
 * Detecta tipo de documento XML
 * @param {string} xmlString 
 * @returns {Promise<string>} - Tipo do documento
 */
const detectXMLType = (xmlString) => {
    return new Promise((resolve, reject) => {
        try {
            // Validação estrutural
            validateXMLStructure(xmlString);
            
            // Parse para detectar elemento raiz
            const parser = new XMLParser({
                ignoreAttributes: false
            });
            
            const xmlObj = parser.parse(xmlString);
            
            // Identifica elemento raiz
            const rootKeys = Object.keys(xmlObj);
            if (rootKeys.length === 0) {
                throw new Error('XML vazio ou sem elemento raiz');
            }
            
            const rootElement = rootKeys[0];
            
            // Mapeia elemento raiz para tipo
            const typeMap = {
                'ReportUrgencia': 'urgencia',
                'ReportConsulta': 'consulta',
                'ReportCirurgia': 'cirurgia'
            };
            
            const type = typeMap[rootElement];
            if (!type) {
                throw new Error(`Tipo de documento XML desconhecido: ${rootElement}`);
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