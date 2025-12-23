// 32_INTEGRACAO_MONGO/services/data_transformer.js
const xml2js = require('xml2js');

// Configuração do Parser XML
const parser = new xml2js.Parser({ 
    explicitArray: false, // Evita criar arrays para campos únicos
    trim: true            // Remove espaços em branco extra
});

/**
 * Transforma XML de Urgência em Objeto JSON.
 * @param {string} xmlString 
 */
const transformUrgencia = async (xmlString) => {
    try {
        const result = await parser.parseStringPromise(xmlString);
        
        // Exemplo de mapeamento (ajustar conforme o teu XML real)
        const dados = result.ReportUrgencia; // Assumindo que a root tag é ReportUrgencia
        
        return {
            hospitalId: dados.Cabecalho.HospitalID,
            dataRegisto: new Date(dados.Cabecalho.DataHora),
            tipo: 'urgencia',
            detalhes: {
                estado: dados.EstadoServico, // Aberta/Fechada
                espera: dados.Espera.map(item => ({
                    triagem: item.CorTriagem,
                    numeroUtentes: parseInt(item.NumeroUtentes),
                    tempoEspera: parseInt(item.TempoEspera)
                }))
            }
        };
    } catch (error) {
        throw new Error('Erro na transformação de Urgência: ' + error.message);
    }
};

/**
 * Transforma XML de Consultas em Objeto JSON.
 */
const transformConsulta = async (xmlString) => {
    try {
        const result = await parser.parseStringPromise(xmlString);
        const dados = result.ReportConsulta;

        return {
            hospitalId: dados.Cabecalho.HospitalID,
            mesReferencia: dados.Cabecalho.Mes, // Ex: "2025-01"
            tipo: 'consulta',
            especialidades: dados.ListaEspecialidades.Especialidade.map(esp => ({
                nome: esp.Nome,
                temposResposta: {
                    prioritario: parseInt(esp.TempoPrioritario),
                    normal: parseInt(esp.TempoNormal)
                }
            }))
        };
    } catch (error) {
        throw new Error('Erro na transformação de Consultas: ' + error.message);
    }
};

// Exporta as funções
module.exports = {
    transformUrgencia,
    transformConsulta
    // Adicionar transformCirurgia aqui depois...
};