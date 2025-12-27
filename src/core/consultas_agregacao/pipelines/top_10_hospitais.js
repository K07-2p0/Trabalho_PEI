const Urgencia = require('../models/Urgencia');

const getTop10HospitaisPediatria = async (dataInicio, dataFim) => {
    return await Urgencia.aggregate([
        {
            // 1. Filtrar pelo tipo de urgência e período
            $match: {
                tipo_urgencia: { $regex: /pediátrica/i },
                data_registo: { 
                    $gte: new Date(dataInicio), 
                    $lte: new Date(dataFim) 
                }
            }
        },
        {
            // 2. Agrupar por Hospital e calcular a média
            $group: {
                _id: "$hospital_id",
                tempoMedio: { $avg: "$tempo_espera" }
            }
        },
        {
            // 3. Ordenar pelos menores tempos
            $sort: { tempoMedio: 1 }
        },
        {
            // 4. Limitar aos 10 melhores
            $limit: 10
        },
        {
            // 5. Cruzar com a coleção de Hospitais para obter detalhes
            $lookup: {
                from: 'hospitais',
                localField: '_id',
                foreignField: 'codigo',
                as: 'hospital'
            }
        },
        { $unwind: '$hospital' },
        {
            // 6. Formatar o resultado final conforme pedido
            $project: {
                _id: 0,
                hospital_nome: "$hospital.nome",
                regiao: "$hospital.nuts2",
                contacto: "$hospital.contacto", // Assume-se que existe este campo no modelo
                tempo_medio_espera: { $round: ["$tempoMedio", 2] }
            }
        }
    ]);
};