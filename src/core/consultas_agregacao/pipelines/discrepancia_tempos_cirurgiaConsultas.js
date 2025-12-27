/**
 * @param {string} granularidade - 'dia', 'semana' ou 'mes'
 */
const getDiscrepanciaConsultaCirurgia = async (granularidade, dataInicio, dataFim) => {
    let format = "%Y-%m-%d"; // Padrão: Dia
    if (granularidade === 'semana') format = "%Y-W%V";
    if (granularidade === 'mes') format = "%Y-%m";

    return await ConsultaCirurgia.aggregate([
        {
            $match: {
                data: { $gte: new Date(dataInicio), $lte: new Date(dataFim) }
            }
        },
        {
            $group: {
                _id: {
                    hospital: "$hospital_id",
                    especialidade: "$especialidade",
                    periodo: { $dateToString: { format: format, date: "$data" } }
                },
                avgConsulta: { $avg: "$tempo_resposta_nao_oncologia" },
                avgCirurgia: { $avg: "$tempo_espera_cirurgia_geral" }
            }
        },
        {
            $project: {
                hospital: "$_id.hospital",
                especialidade: "$_id.especialidade",
                periodo: "$_id.periodo",
                media_consulta: { $round: ["$avgConsulta", 2] },
                media_cirurgia: { $round: ["$avgCirurgia", 2] },
                discrepancia: { $round: [{ $subtract: ["$avgCirurgia", "$avgConsulta"] }, 2] }
            }
        },
        { $sort: { periodo: 1, discrepancia: -1 } }
    ]);
};