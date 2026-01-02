const mongoose = require('mongoose');

/**
 * QUERY 3: Tempo médio de espera nas urgências pediátricas por região
 * Parâmetros: dataInicio, dataFim, regiao (opcional)
 * Agrupa por região geográfica
 */
async function getTempoMedioPediatricas(dataInicio, dataFim, regiao = null) {
    try {
        const matchStage = {
            timestamp: {
                $gte: new Date(dataInicio),
                $lte: new Date(dataFim)
            },
            tipologia: { $regex: /pediátric/i } // Filtra urgências pediátricas
        };

        // Filtro opcional por região
        if (regiao) {
            matchStage.regiao = regiao;
        }

        const pipeline = [
            // 1. Filtrar urgências pediátricas no período
            { $match: matchStage },
            
            // 2. Lookup para obter dados do hospital (região)
            {
                $lookup: {
                    from: 'hospitais',
                    localField: 'hospital_id',
                    foreignField: 'hospital_id',
                    as: 'hospital_info'
                }
            },
            { $unwind: { path: '$hospital_info', preserveNullAndEmptyArrays: true } },
            
            // 3. Calcular total de utentes em espera
            {
                $addFields: {
                    total_utentes_espera: {
                        $add: [
                            { $ifNull: ['$utentes_espera.nao_urgente', 0] },
                            { $ifNull: ['$utentes_espera.pouco_urgente', 0] },
                            { $ifNull: ['$utentes_espera.urgente', 0] },
                            { $ifNull: ['$utentes_espera.muito_urgente', 0] }
                        ]
                    },
                    regiao: { $ifNull: ['$hospital_info.regiao', 'Não Especificada'] }
                }
            },
            
            // 4. Agrupar por região
            {
                $group: {
                    _id: '$regiao',
                    media_utentes_espera: { $avg: '$total_utentes_espera' },
                    total_registos: { $sum: 1 },
                    hospitais: { $addToSet: '$hospital_info.hospital_nome' }
                }
            },
            
            // 5. Formatar resultado
            {
                $project: {
                    _id: 0,
                    regiao: '$_id',
                    media_utentes_espera: { $round: ['$media_utentes_espera', 2] },
                    total_registos: 1,
                    numero_hospitais: { $size: { $ifNull: ['$hospitais', []] } }
                }
            },
            
            // 6. Ordenar por região
            { $sort: { regiao: 1 } }
        ];

        const resultado = await mongoose.connection.db
            .collection('tempos_espera_emergencia')
            .aggregate(pipeline)
            .toArray();

        return resultado;

    } catch (erro) {
        console.error('Erro ao calcular tempo médio pediatria:', erro);
        throw erro;
    }
}

module.exports = { getTempoMedioPediatricas };
