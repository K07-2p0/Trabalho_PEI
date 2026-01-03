const TempoEsperaEmergencia = require('../models/TemposEsperaEmergencia');

/**
 * Pipeline para calcular a média de utentes em espera.
 * @param {Date} dataInicio 
 * @param {Date} dataFim 
 */
const getMediaUtentesEspera = async (dataInicio, dataFim) => {
    return await TempoEsperaEmergencia.aggregate([
        {
            // 1. Filtrar pelo intervalo de tempo
            $match: {
                LastUpdate: {
                    $gte: dataInicio,
                    $lte: dataFim
                }
            }
        },
        {
            // 2. Criar array com todos os níveis de triagem
            $project: {
                tipologia: "$EmergencyType.Description",
                LastUpdate: 1,
                triagens: [
                    { 
                        nome: "Muito Urgente", 
                        utentes: "$Triage.Red.Length",
                        tempo: "$Triage.Red.Time"
                    },
                    { 
                        nome: "Urgente", 
                        utentes: "$Triage.Orange.Length",
                        tempo: "$Triage.Orange.Time"
                    },
                    { 
                        nome: "Pouco Urgente", 
                        utentes: "$Triage.Yellow.Length",
                        tempo: "$Triage.Yellow.Time"
                    },
                    { 
                        nome: "Não Urgente (Verde)", 
                        utentes: "$Triage.Green.Length",
                        tempo: "$Triage.Green.Time"
                    },
                    { 
                        nome: "Não Urgente (Azul)", 
                        utentes: "$Triage.Blue.Length",
                        tempo: "$Triage.Blue.Time"
                    }
                ]
            }
        },
        {
            // 3. Desagregar array de triagens
            $unwind: "$triagens"
        },
        {
            // 4. Agrupar por tipologia e triagem e calcular média
            $group: {
                _id: {
                    tipologia: "$tipologia",
                    triagem: "$triagens.nome"
                },
                media_utentes: { $avg: "$triagens.utentes" }
            }
        },
        {
            // 5. Formatar a saída
            $project: {
                _id: 0,
                tipologia: "$_id.tipologia",
                triagem: "$_id.triagem",
                media_utentes: { $round: ["$media_utentes", 2] }
            }
        },
        {
            // 6. Ordenar para o JSON ficar organizado
            $sort: { tipologia: 1, triagem: 1 }
        }
    ]);
};

module.exports = getMediaUtentesEspera;
