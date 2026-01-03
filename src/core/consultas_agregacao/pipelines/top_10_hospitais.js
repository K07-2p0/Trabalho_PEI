const TempoEsperaEmergencia = require('../models/TemposEsperaEmergencia');
const Hospital = require('../models/Hospital');

/**
 * Top 10 Hospitais com menores tempos de espera em urgência pediátrica
 * @param {String} inicio 
 * @param {String} fim 
 */
const getTop10Hospitais = async (inicio, fim) => {
    const dataInicio = new Date(inicio);
    const dataFim = new Date(fim);
    dataFim.setHours(23, 59, 59, 999);

    return await TempoEsperaEmergencia.aggregate([
        {
            // 1. Filtrar por pediatria e período
            $match: {
                "EmergencyType.Description": /pediátri/i,
                LastUpdate: {
                    $gte: dataInicio,
                    $lte: dataFim
                }
            }
        },
        {
            // 2. Calcular tempo médio por hospital
            $group: {
                _id: "$institutionId",
                tempo_medio: {
                    $avg: {
                        $divide: [
                            {
                                $add: [
                                    { $multiply: [{ $ifNull: ["$Triage.Red.Time", 0] }, { $ifNull: ["$Triage.Red.Length", 0] }] },
                                    { $multiply: [{ $ifNull: ["$Triage.Orange.Time", 0] }, { $ifNull: ["$Triage.Orange.Length", 0] }] },
                                    { $multiply: [{ $ifNull: ["$Triage.Yellow.Time", 0] }, { $ifNull: ["$Triage.Yellow.Length", 0] }] },
                                    { $multiply: [{ $ifNull: ["$Triage.Green.Time", 0] }, { $ifNull: ["$Triage.Green.Length", 0] }] },
                                    { $multiply: [{ $ifNull: ["$Triage.Blue.Time", 0] }, { $ifNull: ["$Triage.Blue.Length", 0] }] }
                                ]
                            },
                            {
                                $add: [
                                    { $ifNull: ["$Triage.Red.Length", 0] },
                                    { $ifNull: ["$Triage.Orange.Length", 0] },
                                    { $ifNull: ["$Triage.Yellow.Length", 0] },
                                    { $ifNull: ["$Triage.Green.Length", 0] },
                                    { $ifNull: ["$Triage.Blue.Length", 0] },
                                    1
                                ]
                            }
                        ]
                    }
                },
                total_registos: { $sum: 1 }
            }
        },
        {
            // 3. Converter institutionId para número
            $addFields: {
                hospital_id_num: { $toInt: "$_id" }
            }
        },
        {
            // 4. Lookup com hospitais
            $lookup: {
                from: 'Hospitais',
                localField: 'hospital_id_num',
                foreignField: 'Codigo',
                as: 'hospital_info'
            }
        },
        {
            $unwind: {
                path: "$hospital_info",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            // 5. Formatar saída
            $project: {
                _id: 0,
                hospital_id: "$_id",
                hospital_nome: "$hospital_info.Nome",
                regiao: "$hospital_info.Regiao",
                tempo_medio_minutos: { $round: ["$tempo_medio", 2] },
                total_registos: 1
            }
        },
        {
            // 6. Ordenar e limitar a 10
            $sort: { tempo_medio_minutos: 1 }
        },
        {
            $limit: 10
        }
    ]);
};

module.exports = getTop10Hospitais;
