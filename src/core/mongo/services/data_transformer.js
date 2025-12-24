// 32_INTEGRACAO_MONGO/services/data_transformer.js
const xml2js = require('xml2js');

// Configuração do Parser XML
const parser = new xml2js.Parser({ 
    explicitArray: false, // Evita criar arrays para campos únicos
    trim: true            // Remove espaços em branco extra
});

/**
 * Transforma XML de Urgência em Objeto JSON.
 * Requisitos: Tipologia, Morada, Estado, Utentes em espera/observação por triagem e Timestamp.
 * @param {string} xmlString 
 */
const transformUrgencia = async (xmlString) => {
    try {
        const result = await parser.parseStringPromise(xmlString);
        const dados = result.ReportUrgencia;
        
        return {
            hospitalId: dados.Cabecalho.HospitalID,
            dataRegisto: new Date(dados.Cabecalho.DataHora),
            tipo: 'urgencia',
            detalhes: {
                tipologia: dados.Tipologia, // Ex: geral, pediátrica, obstétrica
                morada: dados.Morada, // Morada do hospital
                estado: dados.EstadoServico, // Aberta ou Fechada
                // Utentes em espera por escala de triagem
                espera: Array.isArray(dados.Espera.Item) 
                    ? dados.Espera.Item.map(item => ({
                        triagem: item.CorTriagem,
                        numeroUtentes: parseInt(item.NumeroUtentes),
                        tempoEspera: parseInt(item.TempoEspera)
                    }))
                    : [],
                // Utentes em observação por escala de triagem
                observacao: dados.Observacao && Array.isArray(dados.Observacao.Item)
                    ? dados.Observacao.Item.map(item => ({
                        triagem: item.CorTriagem,
                        numeroUtentes: parseInt(item.NumeroUtentes)
                    }))
                    : []
            }
        };
    } catch (error) {
        throw new Error('Erro na transformação de Urgência: ' + error.message);
    }
};

/**
 * Transforma XML de Consultas em Objeto JSON.
 * Requisitos: Especialidade, População alvo, Lista de espera e Tempos médios por prioridade.
 * @param {string} xmlString 
 */
const transformConsulta = async (xmlString) => {
    try {
        const result = await parser.parseStringPromise(xmlString);
        const dados = result.ReportConsulta;

        return {
            hospitalId: dados.Cabecalho.HospitalID,
            mesReferencia: dados.Cabecalho.Periodo, // Período mês/ano
            tipo: 'consulta',
            especialidades: Array.isArray(dados.ListaEspecialidades.Especialidade)
                ? dados.ListaEspecialidades.Especialidade.map(esp => ({
                    nome: esp.Nome, // Especialidade médica
                    populacaoAlvo: esp.PopulacaoAlvo, // Adulto ou criança
                    tipoLista: esp.TipoLista, // Geral, não oncológica, oncológica
                    temposResposta: { // Considera prioridade clínica
                        muitoPrioritario: parseInt(esp.TempoMuitoPrioritario),
                        prioritario: parseInt(esp.TempoPrioritario),
                        normal: parseInt(esp.TempoNormal)
                    }
                }))
                : []
        };
    } catch (error) {
        throw new Error('Erro na transformação de Consultas: ' + error.message);
    }
};

/**
 * Transforma XML de Cirurgias em Objeto JSON.
 * Requisitos: Especialidade cirúrgica, Lista de espera e Tempo médio de espera.
 * @param {string} xmlString 
 */
const transformCirurgia = async (xmlString) => {
    try {
        const result = await parser.parseStringPromise(xmlString);
        const dados = result.ReportCirurgia;

        return {
            hospitalId: dados.Cabecalho.HospitalID,
            mesReferencia: dados.Cabecalho.Periodo, // Período mês/ano
            tipo: 'cirurgia',
            detalhes: {
                especialidade: dados.EspecialidadeCirurgica, // Especialidade cirúrgica
                tipoLista: dados.TipoLista, // Geral, não oncológica, oncológica
                tempoMedioEspera: parseFloat(dados.TempoEspera) // Tempo médio para cirurgia programada
            }
        };
    } catch (error) {
        throw new Error('Erro na transformação de Cirurgias: ' + error.message);
    }
};

// Exporta todas as funções necessárias
module.exports = {
    transformUrgencia,
    transformConsulta,
    transformCirurgia
};