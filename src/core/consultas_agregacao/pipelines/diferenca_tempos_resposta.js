const mongoose = require('mongoose');

/**
 * QUERY 4: Diferença entre tempos de espera oncologia vs. não-oncologia
 * Parâmetros: especialidade, hospitalId (opcional), dataInicio, dataFim
 * Compara tempos médios de consultas oncológicas vs. não-oncológicas
 */
async function getDiferencaOncologia(especialidade, hospitalId = null, dataInicio, dataFim) {
    try {
        const matchStage = {
            especialidade: especialidade,
            data_registo: {
                $gte: new Date(dataInicio),
                $lte: new Date(dataFim)
            }
        };

        if (hospitalId) {
            matchStage.hospital_id = hospitalId;
        }

        const pipeline = [
            // 1. Filtrar por especialidade e período
            { $match: matchStage },
            
            // 2. Separar oncologia vs. não-oncologia
            {
                $group: {
                    _id: {
                        hospital_id: '$hospital_id',
                        tipo: {
                            $cond: [
                                { $regexMatch: { input: '$prioridade', regex: /oncol/i } },
                                'Oncologia',
                                'Não-Oncologia'
                            ]
                        }
                    },
                    tempo_medio_espera: { $avg: '$tempo_medio_dias' },
                    utentes_lista: { $sum: '$utentes_lista_espera' },
                    total_registos: { $sum: 1 }
                }
            },
            
            // 3. Agrupar por hospital para comparar
            {
                $group: {
                    _id: '$_id.hospital_id',
                    dados: {
                        $push: {
                            tipo: '$_id.tipo',
                            tempo_medio: '$tempo_medio_espera',
                            utentes: '$utentes_lista',
                            registos: '$total_registos'
                        }
                    }
                }
            },
            
            // 4. Lookup para nome do hospital
            {
                $lookup: {
                    from: 'hospitais',
                    localField: '_id',
                    foreignField: 'hospital_id',
                    as: 'hospital_info'
                }
            },
            { $unwind: { path: '$hospital_info', preserveNullAndEmptyArrays: true } },
            
            // 5. Calcular diferença
            {
                $project: {
                    _id: 0,
                    hospital_id: '$_id',
                    hospital_nome: { $ifNull: ['$hospital_info.hospital_nome', 'Desconhecido'] },
                    especialidade: especialidade,
                    oncologia: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: '$dados',
                                    cond: { $eq: ['$$this.tipo', 'Oncologia'] }
                                }
                            },
                            0
                        ]
                    },
                    nao_oncologia: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: '$dados',
                                    cond: { $eq: ['$$this.tipo', 'Não-Oncologia'] }
                                }
                            },
                            0
                        ]
                    }
                }
            },
            
            // 6. Adicionar cálculo de diferença
            {
                $addFields: {
                    diferenca_dias: {
                        $round: [
                            {
                                $subtract: [
                                    { $ifNull: ['$oncologia.tempo_medio', 0] },
                                    { $ifNull: ['$nao_oncologia.tempo_medio', 0] }
                                ]
                            },
                            2
                        ]
                    }
                }
            },
            
            // 7. Ordenar por diferença (maior primeiro)
            { $sort: { diferenca_dias: -1 } }
        ];

        const resultado = await mongoose.connection.db
            .collection('tempos_espera_consulta_cirurgia')
            .aggregate(pipeline)
            .toArray();

        return resultado;

    } catch (erro) {
        console.error('Erro ao calcular diferença oncologia:', erro);
        throw erro;
    }
}

module.exports = { getDiferencaOncologia };
