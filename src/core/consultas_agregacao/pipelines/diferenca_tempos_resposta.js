const ConsultaCirurgia = require('../models/ConsultaCirurgia');

const getDiferencaOncologiaPorHospital = async (especialidade, dataInicio, dataFim) => {
    return await ConsultaCirurgia.aggregate([
        {
            $match: {
                especialidade: especialidade,
                data: { $gte: new Date(dataInicio), $lte: new Date(dataFim) }
            }
        },
        {
            $group: {
                _id: "$hospital_id",
                avgOnco: { $avg: "$tempo_resposta_oncologia" },
                avgNaoOnco: { $avg: "$tempo_resposta_nao_oncologia" }
            }
        },
        {
            $project: {
                hospital_id: "$_id",
                media_oncologia: { $round: ["$avgOnco", 2] },
                media_nao_oncologia: { $round: ["$avgNaoOnco", 2] },
                diferenca: { $round: [{ $subtract: ["$avgOnco", "$avgNaoOnco"] }, 2] }
            }
        },
        { $sort: { diferenca: -1 } }
    ]);
};