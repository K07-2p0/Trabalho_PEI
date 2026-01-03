const TempoEsperaConsultaCirurgia = require('../models/TemposEsperaConsultaCirurgia');

/**
 * Tempo médio de espera para cirurgia programada (Geral vs Oncológica)
 * @param {Number} mes 
 * @param {Number} ano 
 */
const getTempoCirurgiaProgramada = async (mes, ano) => {
    const dataInicio = new Date(ano, mes - 1, 1);
    const dataFim = new Date(ano, mes, 0, 23, 59, 59, 999);

    return await TempoEsperaConsultaCirurgia.aggregate([
        {
            // 1. Filtrar por cirurgias e período
            $match: {
                Type: "S", // S = Surgery (Cirurgia)
                LastUpdate: {
                    $gte: dataInicio,
                    $lte: dataFim
                }
            }
        },
        {
            // 2. Classificar tipo de cirurgia
            $addFields: {
                tipo_cirurgia: {
                    $cond: {
                        if: { $regexMatch: { input: "$Specialty.Description", regex: /oncolog/i } },
                        then: "Oncológica",
                        else: "Geral"
                    }
                }
            }
        },
        {
            // 3. Agrupar por tipo
            $group: {
                _id: "$tipo_cirurgia",
                tempo_medio: { $avg: "$Patients.AverageResponseTime" },
                total_pacientes: { $sum: "$Patients.Total" },
                total_registos: { $sum: 1 }
            }
        },
        {
            // 4. Formatar saída
            $project: {
                _id: 0,
                tipo_cirurgia: "$_id",
                tempo_medio_dias: { $round: ["$tempo_medio", 2] },
                total_pacientes: 1,
                total_registos: 1
            }
        },
        {
            $sort: { tempo_medio_dias: 1 }
        }
    ]);
};

module.exports = getTempoCirurgiaProgramada;
