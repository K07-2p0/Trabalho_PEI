const Urgencia = require('../models/Urgencia');

/**
 * Pipeline para calcular a percentagem por categoria de triagem em relação ao total de utentes.
 * @param {String} hospitalId - ID do Hospital para filtro.
 * @param {Date} dataInicio - Data de início do intervalo.
 * @param {Date} dataFim - Data de fim do intervalo.
 * @param {String} periodoAgregacao - Tipo de agrupamento: 'dia', 'semana' ou 'mes'.
 */
const getPercentagemTriagemHospital = async (hospitalId, dataInicio, dataFim, periodoAgregacao) => {
    
    // Determina o formato de data com base no período solicitado
    let format = "%Y-%m-%d"; // Padrão para 'dia'
    if (periodoAgregacao === 'mes') format = "%Y-%m";
    if (periodoAgregacao === 'semana') format = "Semana %V - %Y";

    return await Urgencia.aggregate([
        {
            // 1. Filtrar por Hospital e Intervalo de Datas
            $match: {
                hospital_id: hospitalId,
                data_registo: { $gte: new Date(dataInicio), $lte: new Date(dataFim) }
            }
        },
        {
            // 2. Extrair o período e a hora para definir manhã/tarde/noite
            $addFields: {
                periodo: { $dateToString: { format: format, date: "$data_registo" } },
                hora: { $hour: "$data_registo" }
            }
        },
        {
            // 3. Classificar o período do dia
            $addFields: {
                periodo_dia: {
                    $switch: {
                        branches: [
                            { case: { $and: [{ $gte: ["$hora", 8] }, { $lt: ["$hora", 16] }] }, then: "Manhã" },
                            { case: { $and: [{ $gte: ["$hora", 16] }, { $lt: ["$hora", 24] }] }, then: "Tarde" }
                        ],
                        default: "Noite"
                    }
                }
            }
        },
        {
            // 4. Agrupar para contar utentes por categoria e período
            $group: {
                _id: {
                    periodo: "$periodo",
                    periodo_dia: "$periodo_dia",
                    triagem: "$triagem"
                },
                total_por_categoria: { $sum: 1 }
            }
        },
        {
            // 5. Agrupar novamente para obter o total do período e calcular percentagens
            $group: {
                _id: {
                    periodo: "$_id.periodo",
                    periodo_dia: "$_id.periodo_dia"
                },
                detalhes: {
                    $push: {
                        categoria: "$_id.triagem",
                        quantidade: "$total_por_categoria"
                    }
                },
                total_periodo: { $sum: "$total_por_categoria" }
            }
        },
        { $unwind: "$detalhes" },
        {
            // 6. Formatar o output final com o cálculo da percentagem
            $project: {
                _id: 0,
                periodo: "$_id.periodo",
                periodo_dia: "$_id.periodo_dia",
                categoria_triagem: "$detalhes.categoria",
                quantidade_utentes: "$detalhes.quantidade",
                total_utentes_periodo: "$total_periodo",
                percentagem: {
                    $multiply: [
                        { $divide: ["$detalhes.quantidade", "$total_periodo"] },
                        100
                    ]
                }
            }
        },
        {
            // 7. Ordenação Cronológica
            $sort: { periodo: 1, periodo_dia: 1, categoria_triagem: 1 }
        }
    ]);
};

module.exports = getPercentagemTriagemHospital;