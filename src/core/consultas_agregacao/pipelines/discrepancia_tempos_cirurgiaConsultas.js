const TempoEsperaConsultaCirurgia = require('../models/TemposEsperaConsultaCirurgia');

/**
 * Discrepância entre tempos de resposta de Consultas vs Cirurgias
 * @param {String} granularidade - 'dia', 'semana', 'mes'
 * @param {String} inicio 
 * @param {String} fim 
 */
const getDiscrepanciaTemposCirurgiaConsultas = async (granularidade, inicio, fim) => {
    const dataInicio = new Date(inicio);
    const dataFim = new Date(fim);
    dataFim.setHours(23, 59, 59, 999);

    // Definir formato de agrupamento temporal
    let formatoTemporal;
    switch (granularidade) {
        case 'dia':
            formatoTemporal = { $dateToString: { format: "%Y-%m-%d", date: "$LastUpdate" } };
            break;
        case 'semana':
            formatoTemporal = { 
                $concat: [
                    { $toString: { $year: "$LastUpdate" } },
                    "-W",
                    { $toString: { $week: "$LastUpdate" } }
                ]
            };
            break;
        case 'mes':
            formatoTemporal = { $dateToString: { format: "%Y-%m", date: "$LastUpdate" } };
            break;
        default:
            formatoTemporal = { $dateToString: { format: "%Y-%m-%d", date: "$LastUpdate" } };
    }

    return await TempoEsperaConsultaCirurgia.aggregate([
        {
            // 1. Filtrar por datas
            $match: {
                LastUpdate: {
                    $gte: dataInicio,
                    $lte: dataFim
                }
            }
        },
        {
            // 2. Adicionar período e tipo
            $addFields: {
                periodo: formatoTemporal,
                tipo_servico: {
                    $cond: {
                        if: { $eq: ["$Type", "S"] },
                        then: "Cirurgia",
                        else: "Consulta"
                    }
                }
            }
        },
        {
            // 3. Agrupar por período e tipo
            $group: {
                _id: {
                    periodo: "$periodo",
                    tipo: "$tipo_servico"
                },
                tempo_medio: { $avg: "$Patients.AverageResponseTime" }
            }
        },
        {
            // 4. Agrupar por período para comparar
            $group: {
                _id: "$_id.periodo",
                dados: {
                    $push: {
                        tipo: "$_id.tipo",
                        tempo_medio: "$tempo_medio"
                    }
                }
            }
        },
        {
            // 5. Calcular discrepância
            $project: {
                _id: 0,
                periodo: "$_id",
                consultas: {
                    $arrayElemAt: [
                        {
                            $filter: {
                                input: "$dados",
                                cond: { $eq: ["$$this.tipo", "Consulta"] }
                            }
                        },
                        0
                    ]
                },
                cirurgias: {
                    $arrayElemAt: [
                        {
                            $filter: {
                                input: "$dados",
                                cond: { $eq: ["$$this.tipo", "Cirurgia"] }
                            }
                        },
                        0
                    ]
                }
            }
        },
        {
            $project: {
                periodo: 1,
                tempo_medio_consultas: { $round: ["$consultas.tempo_medio", 2] },
                tempo_medio_cirurgias: { $round: ["$cirurgias.tempo_medio", 2] },
                discrepancia_dias: {
                    $round: [
                        { $subtract: ["$cirurgias.tempo_medio", "$consultas.tempo_medio"] },
                        2
                    ]
                }
            }
        },
        {
            $sort: { periodo: 1 }
        }
    ]);
};

module.exports = getDiscrepanciaTemposCirurgiaConsultas;
