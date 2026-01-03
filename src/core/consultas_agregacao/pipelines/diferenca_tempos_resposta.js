const TempoEsperaConsultaCirurgia = require('../models/TemposEsperaConsultaCirurgia');

/**
 * Diferença entre tempos médios de consultas oncologia vs não-oncologia
 * @param {String} especialidade 
 * @param {String} inicio 
 * @param {String} fim 
 */
const getDiferencaTemposResposta = async (especialidade, inicio, fim) => {
    const dataInicio = new Date(inicio);
    const dataFim = new Date(fim);
    dataFim.setHours(23, 59, 59, 999);

    const resultado = await TempoEsperaConsultaCirurgia.aggregate([
        {
            // 1. Filtrar por especialidade e datas
            $match: {
                "Specialty.Description": new RegExp(especialidade, 'i'),
                LastUpdate: {
                    $gte: dataInicio,
                    $lte: dataFim
                }
            }
        },
        {
            // 2. Classificar como oncológica ou não
            $addFields: {
                tipo_consulta: {
                    $cond: {
                        if: { $regexMatch: { input: "$Specialty.Description", regex: /oncolog/i } },
                        then: "Oncologia",
                        else: "Não-Oncologia"
                    }
                }
            }
        },
        {
            // 3. Agrupar por tipo
            $group: {
                _id: "$tipo_consulta",
                tempo_medio: { $avg: "$Patients.AverageResponseTime" },
                total_pacientes: { $sum: "$Patients.Total" }
            }
        },
        {
            // 4. Formatar saída
            $project: {
                _id: 0,
                tipo: "$_id",
                tempo_medio_dias: { $round: ["$tempo_medio", 2] },
                total_pacientes: 1
            }
        },
        {
            $sort: { tipo: -1 }
        }
    ]);

    // Calcular diferença
    if (resultado.length === 2) {
        const oncologia = resultado.find(r => r.tipo === "Oncologia");
        const naoOncologia = resultado.find(r => r.tipo === "Não-Oncologia");
        
        return {
            comparacao: resultado,
            diferenca_dias: parseFloat((oncologia.tempo_medio_dias - naoOncologia.tempo_medio_dias).toFixed(2))
        };
    }

    return { comparacao: resultado, diferenca_dias: null };
};

module.exports = getDiferencaTemposResposta;
