const TempoEsperaEmergencia = require('../models/TemposEsperaEmergencia');

/**
 * Percentagem de distribuição de triagem por hospital
 * @param {String} hospital_id 
 */
const getPercentagemTriagemHospital = async (hospital_id) => {
    return await TempoEsperaEmergencia.aggregate([
        {
            // 1. Filtrar por hospital
            $match: {
                institutionId: hospital_id
            }
        },
        {
            // 2. Desagregar triagens
            $project: {
                triagens: [
                    { nome: "Vermelho", quantidade: { $ifNull: ["$Triage.Red.Length", 0] } },
                    { nome: "Laranja", quantidade: { $ifNull: ["$Triage.Orange.Length", 0] } },
                    { nome: "Amarelo", quantidade: { $ifNull: ["$Triage.Yellow.Length", 0] } },
                    { nome: "Verde", quantidade: { $ifNull: ["$Triage.Green.Length", 0] } },
                    { nome: "Azul", quantidade: { $ifNull: ["$Triage.Blue.Length", 0] } }
                ]
            }
        },
        {
            $unwind: "$triagens"
        },
        {
            // 3. Agrupar por cor de triagem
            $group: {
                _id: "$triagens.nome",
                total: { $sum: "$triagens.quantidade" }
            }
        },
        {
            // 4. Calcular total geral
            $group: {
                _id: null,
                triagens: {
                    $push: {
                        cor: "$_id",
                        total: "$total"
                    }
                },
                total_geral: { $sum: "$total" }
            }
        },
        {
            $unwind: "$triagens"
        },
        {
            // 5. Calcular percentagens
            $project: {
                _id: 0,
                cor_triagem: "$triagens.cor",
                total_utentes: "$triagens.total",
                percentagem: {
                    $round: [
                        {
                            $multiply: [
                                { $divide: ["$triagens.total", "$total_geral"] },
                                100
                            ]
                        },
                        2
                    ]
                }
            }
        },
        {
            $sort: { percentagem: -1 }
        }
    ]);
};

module.exports = getPercentagemTriagemHospital;
