const mongoose = require('mongoose');

/**
 * QUERY 6: Discrepância entre tempos de espera de consultas e cirurgias
 * Parâmetros: hospitalId, especialidade, dataInicio, dataFim, agregacao ('dia', 'semana', 'mes')
 * Compara evolução temporal de consultas vs. cirurgias
 */
async function getDiscrepanciaConsultaCirurgia(hospitalId, especialidade, dataInicio, dataFim, agregacao = 'dia') {
    try {
        // Determinar formato de data para agregação
        let dateFormat = '%Y-%m-%d'; // dia
        if (agregacao === 'mes') dateFormat = '%Y-%m';
        if (agregacao === 'semana') dateFormat = '%Y-W%V';

        const pipeline = [
            // 1. Filtrar por hospital, especialidade e período
            {
                $match: {
                    hospital_id: hospitalId,
                    especialidade: especialidade,
                    data_registo: {
                        $gte: new Date(dataInicio),
                        $lte: new Date(dataFim)
                    }
                }
            },
            
            // 2. Adicionar período formatado
            {
                $addFields: {
                    periodo: {
                        $dateToString: {
                            format: dateFormat,
                            date: '$data_registo'
                        }
                    }
                }
            },
            
            // 3. Agrupar por período e tipo de atividade
            {
                $group: {
                    _id: {
                        periodo: '$periodo',
                        tipo_atividade: '$tipo_atividade'
                    },
                    tempo_medio_dias: { $avg: '$tempo_medio_dias' },
                    total_utentes: { $sum: '$utentes_lista_espera' },
                    total_registos: { $sum: 1 }
                }
            },
            
            // 4. Separar consultas e cirurgias
            {
                $group: {
                    _id: '$_id.periodo',
                    dados: {
                        $push: {
                            tipo: '$_id.tipo_atividade',
                            tempo_medio: '$tempo_medio_dias',
                            utentes: '$total_utentes',
                            registos: '$total_registos'
                        }
                    }
                }
            },
            
            // 5. Calcular discrepância
            {
                $project: {
                    _id: 0,
                    periodo: '$_id',
                    consulta: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: '$dados',
                                    cond: { $eq: ['$$this.tipo', 'Consulta'] }
                                }
                            },
                            0
                        ]
                    },
                    cirurgia: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: '$dados',
                                    cond: { $eq: ['$$this.tipo', 'Cirurgia'] }
                                }
                            },
                            0
                        ]
                    }
                }
            },
            
            // 6. Adicionar cálculo de discrepância
            {
                $addFields: {
                    discrepancia_dias: {
                        $round: [
                            {
                                $subtract: [
                                    { $ifNull: ['$cirurgia.tempo_medio', 0] },
                                    { $ifNull: ['$consulta.tempo_medio', 0] }
                                ]
                            },
                            2
                        ]
                    },
                    tempo_medio_consulta: { $round: [{ $ifNull: ['$consulta.tempo_medio', 0] }, 2] },
                    tempo_medio_cirurgia: { $round: [{ $ifNull: ['$cirurgia.tempo_medio', 0] }, 2] }
                }
            },
            
            // 7. Ordenar por período
            { $sort: { periodo: 1 } }
        ];

        const resultado = await mongoose.connection.db
            .collection('tempos_espera_consulta_cirurgia')
            .aggregate(pipeline)
            .toArray();

        return resultado;

    } catch (erro) {
        console.error('Erro ao calcular discrepância consulta/cirurgia:', erro);
        throw erro;
    }
}

module.exports = { getDiscrepanciaConsultaCirurgia };
