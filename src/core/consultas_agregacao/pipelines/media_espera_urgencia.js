const Urgencia = require('../models/Urgencia');

/**
 * Pipeline para calcular a média de utentes em espera.
 * @param {Date} dataInicio 
 * @param {Date} dataFim 
 */
const getMediaUtentesEspera = async (dataInicio, dataFim) => {
    return await Urgencia.aggregate([
        {
            // 1. Filtrar pelo intervalo de tempo
            $match: {
                data_registo: {
                    $gte: dataInicio,
                    $lte: dataFim
                }
            }
        },
        {
            // 2. Agrupar por tipologia e triagem e calcular média
            $group: {
                _id: {
                    tipologia: "$tipologia",
                    triagem: "$triagem"
                },
                media_utentes: { $avg: "$utentes_em_espera" }
            }
        },
        {
            // 3. Formatar a saída
            $project: {
                _id: 0,
                tipologia: "$_id.tipologia",
                triagem: "$_id.triagem",
                media_utentes: { $round: ["$media_utentes", 2] }
            }
        },
        {
            // 4. Ordenar para o JSON ficar organizado
            $sort: { tipologia: 1, triagem: 1 }
        }
    ]);
};

module.exports = getMediaUtentesEspera;