const mongoose = require('mongoose');

/**
 * QUERY 8: Evolução temporal com identificação de picos de afluência
 * Parâmetros: data (YYYY-MM-DD), hospitalId (opcional)
 * Analisa variação de utentes ao longo do dia específico
 */
async function getEvolucaoTemporal(data, hospitalId = null) {
    try {
        // Converter string de data para Date objects
        const dataInicio = new Date(data);
        dataInicio.setHours(0, 0, 0, 0);
        
        const dataFim = new Date(data);
        dataFim.setHours(23, 59, 59, 999);

        const matchStage = {
            timestamp: {
                $gte: dataInicio,
                $lte: dataFim
            }
        };

        // Filtro opcional por hospital
        if (hospitalId) {
            matchStage.hospital_id = hospitalId;
        }

        const pipeline = [
            // 1. Filtrar pelo dia específico
            { $match: matchStage },
            
            // 2. Extrair hora do timestamp
            {
                $addFields: {
                    hora: { $hour: '$timestamp' },
                    total_utentes_espera: {
                        $add: [
                            { $ifNull: ['$utentes_espera.nao_urgente', 0] },
                            { $ifNull: ['$utentes_espera.pouco_urgente', 0] },
                            { $ifNull: ['$utentes_espera.urgente', 0] },
                            { $ifNull: ['$utentes_espera.muito_urgente', 0] }
                        ]
                    },
                    total_utentes_observacao: {
                        $add: [
                            { $ifNull: ['$utentes_observacao.nao_urgente', 0] },
                            { $ifNull: ['$utentes_observacao.pouco_urgente', 0] },
                            { $ifNull: ['$utentes_observacao.urgente', 0] },
                            { $ifNull: ['$utentes_observacao.muito_urgente', 0] }
                        ]
                    }
                }
            },
            
            // 3. Agrupar por hora
            {
                $group: {
                    _id: '$hora',
                    media_utentes_espera: { $avg: '$total_utentes_espera' },
                    media_utentes_observacao: { $avg: '$total_utentes_observacao' },
                    max_utentes_espera: { $max: '$total_utentes_espera' },
                    min_utentes_espera: { $min: '$total_utentes_espera' },
                    total_registos: { $sum: 1 }
                }
            },
            
            // 4. Formatar resultado
            {
                $project: {
                    _id: 0,
                    hora: '$_id',
                    media_utentes_espera: { $round: ['$media_utentes_espera', 2] },
                    media_utentes_observacao: { $round: ['$media_utentes_observacao', 2] },
                    pico_utentes_espera: '$max_utentes_espera',
                    minimo_utentes_espera: '$min_utentes_espera',
                    total_registos: 1
                }
            },
            
            // 5. Ordenar por hora
            { $sort: { hora: 1 } }
        ];

        const resultado = await mongoose.connection.db
            .collection('tempos_espera_emergencia')
            .aggregate(pipeline)
            .toArray();

        // 6. Identificar picos de afluência (valores acima da média)
        if (resultado.length > 0) {
            const mediaGeral = resultado.reduce((sum, r) => sum + r.media_utentes_espera, 0) / resultado.length;
            
            resultado.forEach(r => {
                r.e_pico = r.media_utentes_espera > mediaGeral * 1.2; // 20% acima da média
                r.percentagem_acima_media = Math.round(((r.media_utentes_espera - mediaGeral) / mediaGeral) * 100);
            });
        }

        return resultado;

    } catch (erro) {
        console.error('Erro ao calcular evolução temporal:', erro);
        throw erro;
    }
}

module.exports = { getEvolucaoTemporal };
