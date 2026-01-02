const mongoose = require('mongoose');

/**
 * QUERY 2: Percentagem por categoria de triagem em relação ao total de utentes
 * Parâmetros: hospitalId, dataInicio, dataFim, periodoAgregacao ('dia', 'semana', 'mes')
 * Discrimina por período do dia (Manhã, Tarde, Noite)
 */
async function getPercentagemTriagem(hospitalId, dataInicio, dataFim, periodoAgregacao = 'dia') {
    try {
        // Determina o formato de data com base no período solicitado
        let format = "%Y-%m-%d"; // Padrão para 'dia'
        if (periodoAgregacao === 'mes') format = "%Y-%m";
        if (periodoAgregacao === 'semana') format = "Semana %V - %Y";

        const pipeline = [
            // 1. Filtrar por Hospital e Intervalo de Datas
            {
                $match: {
                    hospital_id: hospitalId,
                    timestamp: {
                        $gte: new Date(dataInicio),
                        $lte: new Date(dataFim)
                    }
                }
            },
            // 2. Extrair o período e a hora para definir manhã/tarde/noite
            {
                $addFields: {
                    periodo: { $dateToString: { format: format, date: "$timestamp" } },
                    hora: { $hour: "$timestamp" }
                }
            },
            // 3. Classificar o período do dia
            {
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
            // 4. Transformar categorias em array para processar
            {
                $project: {
                    periodo: 1,
                    periodo_dia: 1,
                    categorias: [
                        { triagem: 'não urgente', quantidade: '$utentes_espera.nao_urgente' },
                        { triagem: 'pouco urgente', quantidade: '$utentes_espera.pouco_urgente' },
                        { triagem: 'urgente', quantidade: '$utentes_espera.urgente' },
                        { triagem: 'muito urgente', quantidade: '$utentes_espera.muito_urgente' }
                    ]
                }
            },
            { $unwind: "$categorias" },
            // 5. Agrupar para contar utentes por categoria e período
            {
                $group: {
                    _id: {
                        periodo: "$periodo",
                        periodo_dia: "$periodo_dia",
                        triagem: "$categorias.triagem"
                    },
                    total_por_categoria: { $sum: "$categorias.quantidade" }
                }
            },
            // 6. Agrupar novamente para obter o total do período
            {
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
            // 7. Calcular percentagens
            {
                $project: {
                    _id: 0,
                    periodo: "$_id.periodo",
                    periodo_dia: "$_id.periodo_dia",
                    categoria_triagem: "$detalhes.categoria",
                    quantidade_utentes: "$detalhes.quantidade",
                    total_utentes_periodo: "$total_periodo",
                    percentagem: {
                        $round: [
                            {
                                $multiply: [
                                    { $divide: ["$detalhes.quantidade", "$total_periodo"] },
                                    100
                                ]
                            },
                            2
                        ]
                    }
                }
            },
            // 8. Ordenação
            {
                $sort: { periodo: 1, periodo_dia: 1, categoria_triagem: 1 }
            }
        ];

        const resultado = await mongoose.connection.db
            .collection('tempos_espera_emergencia')
            .aggregate(pipeline)
            .toArray();

        return resultado;

    } catch (erro) {
        console.error('Erro ao calcular percentagem triagem:', erro);
        throw erro;
    }
}

module.exports = { getPercentagemTriagem };
