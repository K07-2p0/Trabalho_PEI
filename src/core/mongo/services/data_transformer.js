const xml2js = require('xml2js');
const mongoose = require('mongoose');

const parser = new xml2js.Parser({ 
    explicitArray: false,
    trim: true,
    valueProcessors: [xml2js.processors.parseNumbers]
});

/**
 * Transforma XML de Urgência em Objeto MongoDB
 */
const transformUrgencia = async (xmlString) => {
    try {
        const result = await parser.parseStringPromise(xmlString);
        const dados = result.ReportUrgencia;
        
        // Validação de dados obrigatórios
        if (!dados.Cabecalho || !dados.Cabecalho.HospitalID) {
            throw new Error('HospitalID ausente no cabeçalho');
        }

        // Processa utentes em espera
        const processarEspera = (espera) => {
            if (!espera || !espera.Item) return [];
            const items = Array.isArray(espera.Item) ? espera.Item : [espera.Item];
            return items.map(item => ({
                triagem: item.CorTriagem || 'Desconhecida',
                numeroUtentes: parseInt(item.NumeroUtentes) || 0,
                tempoMedioEspera: parseInt(item.TempoEspera) || 0
            }));
        };

        // Processa utentes em observação
        const processarObservacao = (observacao) => {
            if (!observacao || !observacao.Item) return [];
            const items = Array.isArray(observacao.Item) ? observacao.Item : [observacao.Item];
            return items.map(item => ({
                triagem: item.CorTriagem || 'Desconhecida',
                numeroUtentes: parseInt(item.NumeroUtentes) || 0
            }));
        };

        return {
            hospitalId: dados.Cabecalho.HospitalID.trim(),
            dataRegisto: new Date(dados.Cabecalho.DataHora),
            tipo: 'urgencia',
            tipologia: dados.Tipologia || 'Geral',
            morada: dados.Morada || '',
            estado: dados.EstadoServico || 'Desconhecido',
            utentesEspera: processarEspera(dados.Espera),
            utentesObservacao: processarObservacao(dados.Observacao),
            dataIntegracao: new Date(),
            fonteOriginal: 'XML'
        };
    } catch (error) {
        throw new Error(`Erro na transformação de Urgência: ${error.message}`);
    }
};

/**
 * Transforma XML de Consultas em Objeto MongoDB
 */
const transformConsulta = async (xmlString) => {
    try {
        const result = await parser.parseStringPromise(xmlString);
        const dados = result.ReportConsulta;

        if (!dados.Cabecalho || !dados.Cabecalho.HospitalID) {
            throw new Error('HospitalID ausente no cabeçalho');
        }

        // Processa especialidades
        const processarEspecialidades = (lista) => {
            if (!lista || !lista.Especialidade) return [];
            const specs = Array.isArray(lista.Especialidade) 
                ? lista.Especialidade 
                : [lista.Especialidade];
            
            return specs.map(esp => ({
                nome: esp.Nome || 'Desconhecida',
                populacaoAlvo: esp.PopulacaoAlvo || 'Ambos',
                tipoLista: esp.TipoLista || 'Geral',
                temposResposta: {
                    muitoPrioritario: parseInt(esp.TempoMuitoPrioritario) || 0,
                    prioritario: parseInt(esp.TempoPrioritario) || 0,
                    normal: parseInt(esp.TempoNormal) || 0
                },
                numeroUtentesEspera: parseInt(esp.NumeroUtentes) || 0
            }));
        };

        // Extrai mês e ano do período (ex: "2025-01" ou "Janeiro/2025")
        const parsePeriodo = (periodoStr) => {
            const match = periodoStr.match(/(\d{4})-(\d{2})/);
            if (match) {
                return {
                    ano: parseInt(match[1]),
                    mes: parseInt(match[2])
                };
            }
            return { ano: new Date().getFullYear(), mes: new Date().getMonth() + 1 };
        };

        const periodo = parsePeriodo(dados.Cabecalho.Periodo);

        return {
            hospitalId: dados.Cabecalho.HospitalID.trim(),
            tipo: 'consulta',
            mesReferencia: periodo.mes,
            anoReferencia: periodo.ano,
            especialidades: processarEspecialidades(dados.ListaEspecialidades),
            dataIntegracao: new Date(),
            fonteOriginal: 'XML'
        };
    } catch (error) {
        throw new Error(`Erro na transformação de Consultas: ${error.message}`);
    }
};

/**
 * Transforma XML de Cirurgias em Objeto MongoDB
 */
const transformCirurgia = async (xmlString) => {
    try {
        const result = await parser.parseStringPromise(xmlString);
        const dados = result.ReportCirurgia;

        if (!dados.Cabecalho || !dados.Cabecalho.HospitalID) {
            throw new Error('HospitalID ausente no cabeçalho');
        }

        // Processa especialidades cirúrgicas
        const processarCirurgias = (lista) => {
            if (!lista || !lista.Especialidade) return [];
            const specs = Array.isArray(lista.Especialidade) 
                ? lista.Especialidade 
                : [lista.Especialidade];
            
            return specs.map(esp => ({
                especialidade: esp.Nome || 'Desconhecida',
                tipoLista: esp.TipoLista || 'Geral',
                tempoMedioEspera: parseFloat(esp.TempoEspera) || 0,
                numeroCirurgias: parseInt(esp.NumeroCirurgias) || 0,
                numeroUtentesEspera: parseInt(esp.NumeroUtentes) || 0
            }));
        };

        const parsePeriodo = (periodoStr) => {
            const match = periodoStr.match(/(\d{4})-(\d{2})/);
            if (match) {
                return {
                    ano: parseInt(match[1]),
                    mes: parseInt(match[2])
                };
            }
            return { ano: new Date().getFullYear(), mes: new Date().getMonth() + 1 };
        };

        const periodo = parsePeriodo(dados.Cabecalho.Periodo);

        return {
            hospitalId: dados.Cabecalho.HospitalID.trim(),
            tipo: 'cirurgia',
            mesReferencia: periodo.mes,
            anoReferencia: periodo.ano,
            especialidades: processarCirurgias(dados.ListaEspecialidades),
            dataIntegracao: new Date(),
            fonteOriginal: 'XML'
        };
    } catch (error) {
        throw new Error(`Erro na transformação de Cirurgias: ${error.message}`);
    }
};

module.exports = {
    transformUrgencia,
    transformConsulta,
    transformCirurgia
};