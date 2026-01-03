const TempoEsperaEmergencia = require('../models/TemposEsperaEmergencia');

/**
 * Evolução temporal de afluência às urgências (15 em 15 minutos)
 * @param {String} data - YYYY-MM-DD
 */
const getEvolucaoTemporal = async (data) => {
    const dataInicio = new Date(data);
    const dataFim = new Date(data);
    dataFim.setHours(23, 59, 59, 999);

    return await TempoEsperaEmergencia.aggregate([
        {
            // 1. Filtrar por data específica
            $match: {
                LastUpdate: {
                    $gte: dataInicio,
                    $lte: dataFim
                }
            }
        },
        {
            // 2. Criar intervalos de 15 minutos
            $addFields: {
                hora: { $hour: "$LastUpdate" },
                minuto_intervalo: {
                    $multiply: [
                        { $floor: { $divide: [{ $minute: "$LastUpdate" }, 15] } },
                        15
                    ]
                }
            }
        },
        {
            // 3. Criar string do intervalo
            $addFields: {
                intervalo: {
                    $concat: [
                        { $toString: "$hora" },
                        ":",
                        {
                            $cond: {
                                if: { $lt: ["$minuto_intervalo", 10] },
                                then: { $concat: ["0", { $toString: "$minuto_intervalo" }] },
                                else: { $toString: "$minuto_intervalo" }
                            }
                        }
                    ]
                }
            }
        },
        {
            // 4. Agrupar por intervalo
            $group: {
                _id: "$intervalo",
                total_utentes: {
                    $sum: {
                        $add: [
                            { $ifNull: ["$Triage.Red.Length", 0] },
                            { $ifNull: ["$Triage.Orange.Length", 0] },
                            { $ifNull: ["$Triage.Yellow.Length", 0] },
                            { $ifNull: ["$Triage.Green.Length", 0] },
                            { $ifNull: ["$Triage.Blue.Length", 0] }
                        ]
                    }
                },
                tempo_medio: {
                    $avg: {
                        $divide: [
                            {
                                $add: [
                                    { $ifNull: ["$Triage.Red.Time", 0] },
                                    { $ifNull: ["$Triage.Orange.Time", 0] },
                                    { $ifNull: ["$Triage.Yellow.Time", 0] },
                                    { $ifNull: ["$Triage.Green.Time", 0] },
                                    { $ifNull: ["$Triage.Blue.Time", 0] }
                                ]
                            },
                            5
                        ]
                    }
                },
                num_registos: { $sum: 1 }
            }
        },
        {
            // 5. Formatar saída
            $project: {
                _id: 0,
                intervalo: "$_id",
                total_utentes: 1,
                tempo_medio_minutos: { $round: ["$tempo_medio", 2] },
                num_registos: 1
            }
        },
        {
            $sort: { intervalo: 1 }
        }
    ]);
};

module.exports = getEvolucaoTemporal;
