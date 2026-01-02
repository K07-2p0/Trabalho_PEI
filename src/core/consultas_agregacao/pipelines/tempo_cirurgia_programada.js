const mongoose = require('mongoose');

/**
 * QUERY 5: Tempo médio de espera para cirurgia programada (geral vs. oncológica)
 * Parâmetros: especialidade, dataInicio, dataFim
 * Discrimina entre cirurgia geral e oncológica
 */
async function getTempoMedioCirurgia(especialidade, dataInicio, dataFim) {
    try {
        const pipeline = [
            // 1. Filtrar cirurgias da especialidade no período
            {
                $match: {
                    tipo_atividade: 'Cirurgia',
                    especialidade: especialidade,
                    data_registo: {
                        $gte: new Date(dataInicio),
                        $lte: new Date(dataFim)
                    }
                }
            },
            
            // 2. Classificar como oncológica ou não
            {
                $addFields: {
                    tipo_cirurgia: {
                        $cond: [
                            { $regexMatch: { input: '$prioridade', regex: /oncol/i } },
                            'Oncológica',
                            'Geral'
                        ]
                    }
                }
            },
            
            // 3. Agrupar por tipo de cirurgia e prioridade
            {
                $group: {
                    _id: {
                        tipo: '$tipo_cirurgia',
                        prioridade: '$prioridade'
                    },
                    tempo_medio_espera_dias: { $avg: '$tempo_medio_dias' },
                    total_utentes_espera: { $sum: '$utentes_lista_espera' },
                    total_registos: { $sum: 1 }
                }
            },
            
            // 4. Formatar resultado
            {
                $project: {
                    _id: 0,
                    tipo_cirurgia: '$_id.tipo',
                    prioridade: '$_id.prioridade',
                    tempo_medio_dias: { $round: ['$tempo_medio_espera_dias', 2] },
                    total_utentes_lista_espera: '$total_utentes_espera',
                    total_registos: 1
                }
            },
            
            // 5. Ordenar por tipo e tempo médio
            {
                $sort: { tipo_cirurgia: 1, tempo_medio_dias: -1 }
            }
        ];

        const resultado = await mongoose.connection.db
            .collection('tempos_espera_consulta_cirurgia')
            .aggregate(pipeline)
            .toArray();

        return resultado;

    } catch (erro) {
        console.error('Erro ao calcular tempo médio cirurgia:', erro);
        throw erro;
    }
}

module.exports = { getTempoMedioCirurgia };
