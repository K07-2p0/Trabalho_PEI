const mongoose = require('mongoose');

/**
 * QUERY 7: Top 10 hospitais com menores tempos de espera nas urgências pediátricas
 * Parâmetros: dataInicio, dataFim, limite (default: 10)
 * Retorna ranking de hospitais pediátricos
 */
async function getTopHospitaisPediatria(dataInicio, dataFim, limite = 10) {
    try {
        const pipeline = [
            // 1. Filtrar urgências pediátricas no período
            {
                $match: {
                    timestamp: {
                        $gte: new Date(dataInicio),
                        $lte: new Date(dataFim)
                    },
                    tipologia: { $regex: /pediátric/i }
                }
            },
            
            // 2. Calcular total de utentes em espera por registo
            {
                $addFields: {
                    total_utentes_espera: {
                        $add: [
                            { $ifNull: ['$utentes_espera.nao_urgente', 0] },
                            { $ifNull: ['$utentes_espera.pouco_urgente', 0] },
                            { $ifNull: ['$utentes_espera.urgente', 0] },
                            { $ifNull: ['$utentes_espera.muito_urgente', 0] }
                        ]
                    }
                }
            },
            
            // 3. Agrupar por hospital
            {
                $group: {
                    _id: '$hospital_id',
                    media_utentes_espera: { $avg: '$total_utentes_espera' },
                    total_registos: { $sum: 1 }
                }
            },
            
            // 4. Lookup para obter informações do hospital
            {
                $lookup: {
                    from: 'hospitais',
                    localField: '_id',
                    foreignField: 'hospital_id',
                    as: 'hospital_info'
                }
            },
            { $unwind: { path: '$hospital_info', preserveNullAndEmptyArrays: true } },
            
            // 5. Formatar resultado
            {
                $project: {
                    _id: 0,
                    hospital_id: '$_id',
                    hospital_nome: { $ifNull: ['$hospital_info.hospital_nome', 'Desconhecido'] },
                    regiao: { $ifNull: ['$hospital_info.regiao', 'N/A'] },
                    contacto: { $ifNull: ['$hospital_info.contacto', 'N/A'] },
                    media_utentes_espera: { $round: ['$media_utentes_espera', 2] },
                    total_registos: 1
                }
            },
            
            // 6. Ordenar por menor tempo médio (menores valores = melhor)
            { $sort: { media_utentes_espera: 1 } },
            
            // 7. Limitar ao top N
            { $limit: limite }
        ];

        const resultado = await mongoose.connection.db
            .collection('tempos_espera_emergencia')
            .aggregate(pipeline)
            .toArray();

        return resultado;

    } catch (erro) {
        console.error('Erro ao calcular top hospitais pediatria:', erro);
        throw erro;
    }
}

module.exports = { getTopHospitaisPediatria };
