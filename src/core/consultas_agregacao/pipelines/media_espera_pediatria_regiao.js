const Urgencia = require('../models/Urgencia');

/**
 * Pipeline para calcular o tempo médio de espera para triagem nas urgências pediátricas por região.
 * @param {Date} dataInicio - Data de início do período (ex: início do mês/semana/trimestre)
 * @param {Date} dataFim - Data de fim do período (geralmente a data atual)
 */
const getMediaEsperaPediatriaPorRegiao = async (dataInicio, dataFim) => {
    return await Urgencia.aggregate([
        {
            // 1. Filtrar por urgências pediátricas e pelo intervalo de datas
            $match: {
                tipo_urgencia: { $regex: /pediatrica/i }, // Filtra por tipo "Pediátrica"
                data_registo: { 
                    $gte: new Date(dataInicio), 
                    $lte: new Date(dataFim) 
                }
            }
        },
        {
            // 2. Realizar o "join" com a coleção de Hospitais para obter a localização/região
            $lookup: {
                from: 'hospitais',        // Nome da coleção no MongoDB
                localField: 'hospital_id', // Campo em Urgencia
                foreignField: 'codigo',    // Campo em Hospital (HospitalID no CSV) [cite: 147, 150]
                as: 'hospital_info'
            }
        },
        {
            // 3. Desconstruir o array resultante do lookup
            $unwind: '$hospital_info'
        },
        {
            // 4. Agrupar pela região do hospital (NUTSIIDescription no CSV)
            $group: {
                _id: '$hospital_info.nuts2', // Assume-se 'nuts2' ou 'regiao' no modelo Hospital
                tempoMedioEspera: { $avg: '$tempo_espera' }, // Calcula a média do campo de tempo
                totalRegistos: { $sum: 1 }
            }
        },
        {
            // 5. Formatar a saída final
            $project: {
                _id: 0,
                regiao: '$_id',
                tempo_medio_minutos: { $round: ['$tempoMedioEspera', 2] },
                total_atendimentos: '$totalRegistos'
            }
        },
        {
            // 6. Ordenar por região ou por tempo médio
            $sort: { tempo_medio_minutos: 1 }
        }
    ]);
};

module.exports = getMediaEsperaPediatriaPorRegiao;