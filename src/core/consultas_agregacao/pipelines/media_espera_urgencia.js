const mongoose = require('mongoose');

/**
 * QUERY 1: Média de utentes em espera para 1ª observação médica por tipologia
 * Parâmetros: dataInicio, dataFim, tipologia (opcional)
 * Discrimina por categoria de triagem
 */
async function getMediaEsperaUrgencia(dataInicio, dataFim, tipologia = null) {
    try {
        const matchStage = {
            timestamp: {
                $gte: new Date(dataInicio),
                $lte: new Date(dataFim)
            }
        };

        // Filtro opcional por tipologia
        if (tipologia) {
            matchStage.tipologia = tipologia;
        }

        const pipeline = [
            // Filtrar por período e tipologia (se especificado)
            { $match: matchStage },
            
            // Unwind dos utentes em espera por categoria
            {
                $project: {
                    tipologia: 1,
                    timestamp: 1,
                    utentes: [
                        { 
                            categoria: 'não urgente', 
                            quantidade: '$utentes_espera.nao_urgente' 
                        },
                        { 
                            categoria: 'pouco urgente', 
                            quantidade: '$utentes_espera.pouco_urgente' 
                        },
                        { 
                            categoria: 'urgente', 
                            quantidade: '$utentes_espera.urgente' 
                        },
                        { 
                            categoria: 'muito urgente', 
                            quantidade: '$utentes_espera.muito_urgente' 
                        }
                    ]
                }
            },
            { $unwind: '$utentes' },
            
            // Agrupar por tipologia e categoria de triagem
            {
                $group: {
                    _id: {
                        tipologia: '$tipologia',
                        categoria: '$utentes.categoria'
                    },
                    media_utentes: { $avg: '$utentes.quantidade' },
                    total_registos: { $sum: 1 }
                }
            },
            
            // Ordenar por tipologia e categoria
            {
                $sort: {
                    '_id.tipologia': 1,
                    '_id.categoria': 1
                }
            },
            
            // Formatar resultado
            {
                $project: {
                    _id: 0,
                    tipologia: '$_id.tipologia',
                    categoria_triagem: '$_id.categoria',
                    media_utentes_espera: { $round: ['$media_utentes', 2] },
                    total_registos: 1
                }
            }
        ];

        // Executar pipeline diretamente na coleção
        const resultado = await mongoose.connection.db
            .collection('tempos_espera_emergencia')
            .aggregate(pipeline)
            .toArray();

        return resultado;

    } catch (erro) {
        console.error('Erro ao calcular média de espera urgência:', erro);
        throw erro;
    }
}

module.exports = { getMediaEsperaUrgencia };
