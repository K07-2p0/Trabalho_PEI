const xml2js = require('xml2js');

const parser = new xml2js.Parser({ 
    explicitArray: false,
    trim: true,
    valueProcessors: [xml2js.processors.parseNumbers]
});

// Mapeamento de meses em português para números
const mesesPortugues = {
    'Janeiro': 'Janeiro',
    'Fevereiro': 'Fevereiro',
    'Março': 'Março',
    'Abril': 'Abril',
    'Maio': 'Maio',
    'Junho': 'Junho',
    'Julho': 'Julho',
    'Agosto': 'Agosto',
    'Setembro': 'Setembro',
    'Outubro': 'Outubro',
    'Novembro': 'Novembro',
    'Dezembro': 'Dezembro'
};

// Mapeamento de cores de triagem para nomes
const coresTriagem = {
    'Vermelho': 'Red',
    'Laranja': 'Orange',
    'Amarelo': 'Yellow',
    'Verde': 'Green',
    'Azul': 'Blue'
};

/**
 * Transforma XML de Urgência em formato TemposEsperaEmergencia
 */
const transformUrgencia = async (xmlString) => {
    try {
        const result = await parser.parseStringPromise(xmlString);
        const dados = result.ReportUrgencia;
        
        if (!dados.Cabecalho || !dados.Cabecalho.HospitalID) {
            throw new Error('HospitalID ausente no cabeçalho');
        }

        const processarTriagem = (espera) => {
            const triageData = {
                Red: { Time: 0, Length: 0 },
                Orange: { Time: 0, Length: 0 },
                Yellow: { Time: 0, Length: 0 },
                Green: { Time: 0, Length: 0 },
                Blue: { Time: 0, Length: 0 }
            };

            if (espera && espera.Item) {
                const items = Array.isArray(espera.Item) ? espera.Item : [espera.Item];
                items.forEach(item => {
                    const corTraduzida = coresTriagem[item.CorTriagem] || item.CorTriagem;
                    if (triageData[corTraduzida]) {
                        triageData[corTraduzida].Time = parseInt(item.TempoEspera) || 0;
                        triageData[corTraduzida].Length = parseInt(item.NumeroUtentes) || 0;
                    }
                });
            }

            return triageData;
        };

        return {
            LastUpdate: new Date(dados.Cabecalho.DataHora),
            extractionDate: new Date(),
            institutionId: dados.Cabecalho.HospitalID.trim(),
            EmergencyType: {
                Code: dados.Tipologia || 'Geral',
                Description: dados.EstadoServico || 'Desconhecido'
            },
            Triage: processarTriagem(dados.Espera)
        };
    } catch (error) {
        throw new Error(`Erro na transformação de Urgência: ${error.message}`);
    }
};

/**
 * Transforma XML de Consultas em formato TemposEsperaConsultaCirurgia
 */
const transformConsulta = async (xmlString) => {
    try {
        const result = await parser.parseStringPromise(xmlString);
        const dados = result.ReportConsulta;

        if (!dados.Cabecalho || !dados.Cabecalho.HospitalID) {
            throw new Error('HospitalID ausente no cabeçalho');
        }

        const parsePeriodo = (periodoStr) => {
            const match = periodoStr.match(/(\d{4})-(\d{2})/);
            if (match) {
                const ano = parseInt(match[1]);
                const mesNum = parseInt(match[2]);
                const mesesArray = Object.keys(mesesPortugues);
                return {
                    ano: ano,
                    mes: mesesArray[mesNum - 1]
                };
            }
            return { ano: new Date().getFullYear(), mes: 'Janeiro' };
        };

        const periodo = parsePeriodo(dados.Cabecalho.Periodo);
        const documentos = [];

        // Processar especialidades
        if (dados.ListaEspecialidades && dados.ListaEspecialidades.Especialidade) {
            const especialidades = Array.isArray(dados.ListaEspecialidades.Especialidade) 
                ? dados.ListaEspecialidades.Especialidade 
                : [dados.ListaEspecialidades.Especialidade];
            
            especialidades.forEach(esp => {
                // Criar documento para cada tempo de resposta
                const temposResposta = [
                    { prioridade: 'MuitoPrioritario', tempo: esp.TempoMuitoPrioritario },
                    { prioridade: 'Prioritario', tempo: esp.TempoPrioritario },
                    { prioridade: 'Normal', tempo: esp.TempoNormal }
                ];

                temposResposta.forEach(tr => {
                    if (tr.tempo) {
                        documentos.push({
                            HospitalName: dados.Cabecalho.HospitalID.trim(), // Será substituído pelo nome real
                            ServiceKey: 0, // Será calculado baseado na especialidade + prioridade
                            AverageWaitingTime_Speciality_Priority_Institution: parseInt(tr.tempo) || 0,
                            MonthPortuguese: periodo.mes,
                            Year: periodo.ano,
                            NumberOfPeople: parseInt(esp.NumeroUtentes) || 0,
                            _metadata: {
                                especialidade: esp.Nome,
                                prioridade: tr.prioridade,
                                tipoLista: esp.TipoLista,
                                populacaoAlvo: esp.PopulacaoAlvo
                            }
                        });
                    }
                });
            });
        }

        return documentos;
    } catch (error) {
        throw new Error(`Erro na transformação de Consultas: ${error.message}`);
    }
};

/**
 * Transforma XML de Cirurgias em formato TemposEsperaConsultaCirurgia
 */
const transformCirurgia = async (xmlString) => {
    try {
        const result = await parser.parseStringPromise(xmlString);
        const dados = result.ReportCirurgia;

        if (!dados.Cabecalho || !dados.Cabecalho.HospitalID) {
            throw new Error('HospitalID ausente no cabeçalho');
        }

        const parsePeriodo = (periodoStr) => {
            const match = periodoStr.match(/(\d{4})-(\d{2})/);
            if (match) {
                const ano = parseInt(match[1]);
                const mesNum = parseInt(match[2]);
                const mesesArray = Object.keys(mesesPortugues);
                return {
                    ano: ano,
                    mes: mesesArray[mesNum - 1]
                };
            }
            return { ano: new Date().getFullYear(), mes: 'Janeiro' };
        };

        const periodo = parsePeriodo(dados.Cabecalho.Periodo);
        const documentos = [];

        // Processar especialidades
        if (dados.ListaEspecialidades && dados.ListaEspecialidades.Especialidade) {
            const especialidades = Array.isArray(dados.ListaEspecialidades.Especialidade) 
                ? dados.ListaEspecialidades.Especialidade 
                : [dados.ListaEspecialidades.Especialidade];
            
            especialidades.forEach(esp => {
                documentos.push({
                    HospitalName: dados.Cabecalho.HospitalID.trim(), // Será substituído pelo nome real
                    ServiceKey: 0, // Será calculado baseado na especialidade
                    AverageWaitingTime_Speciality_Priority_Institution: parseFloat(esp.TempoEspera) || 0,
                    MonthPortuguese: periodo.mes,
                    Year: periodo.ano,
                    NumberOfPeople: parseInt(esp.NumeroUtentes) || 0,
                    _metadata: {
                        especialidade: esp.Nome,
                        tipoLista: esp.TipoLista,
                        numeroCirurgias: esp.NumeroCirurgias
                    }
                });
            });
        }

        return documentos;
    } catch (error) {
        throw new Error(`Erro na transformação de Cirurgias: ${error.message}`);
    }
};

module.exports = {
    transformUrgencia,
    transformConsulta,
    transformCirurgia
};
