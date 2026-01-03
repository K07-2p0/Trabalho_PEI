const TempoEsperaEmergencia = require('../models/TemposEsperaEmergencia');
const Hospital = require('../models/Hospital');

/**
 * Tempo médio de espera nas urgências pediátricas por região
 * @param {String} inicio - Data início (YYYY-MM-DD)
 * @param {String} fim - Data fim (YYYY-MM-DD)
 */
const getMediaEsperaPediatriaRegiao = async (inicio, fim) => {
    const dataInicio = new Date(inicio);
    const dataFim = new Date(fim);
    dataFim.setHours(23, 59, 59, 999);

    return await TempoEsperaEmergencia.aggregate([
        {
            // 1. Filtrar por datas e tipo pediátrico
            $match: {
                LastUpdate: {
                    $gte: dataInicio,
                    $lte: dataFim
                },
                "EmergencyType.Description": /pediátri/i
            }
        },
        {
            // 2. Calcular tempo médio geral por hospital
            $group: {
                _id: "$institutionId",
                tempo_medio_total: {
                    $avg: {
                        $add: [
                            { $ifNull: ["$Triage.Red.Time", 0] },
                            { $ifNull: ["$Triage.Orange.Time", 0] },
                            { $ifNull: ["$Triage.Yellow.Time", 0] },
                            { $ifNull: ["$Triage.Green.Time", 0] },
                            { $ifNull: ["$Triage.Blue.Time", 0] }
                        ]
                    }
                }
            }
        },
        {
            // 3. Converter institutionId para número para join
            $addFields: {
                hospital_id_num: { $toInt: "$_id" }
            }
        },
        {
            // 4. Lookup com hospitais para obter região
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
            // 5. Agrupar por região
            $group: {
                _id: "$hospital_info.Regiao",
                tempo_medio_regiao: { $avg: "$tempo_medio_total" },
                num_hospitais: { $sum: 1 }
            }
        },
        {
            // 6. Formatar saída
            $project: {
                _id: 0,
                regiao: "$_id",
                tempo_medio_minutos: { $round: ["$tempo_medio_regiao", 2] },
                num_hospitais: 1
            }
        },
        {
            $sort: { tempo_medio_minutos: 1 }
        }
    ]);
};

module.exports = getMediaEsperaPediatriaRegiao;
