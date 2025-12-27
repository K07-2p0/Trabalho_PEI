const getMediaCirurgiaPorEspecialidade = async (mes, ano) => {
    const dataInicio = new Date(ano, mes - 1, 1);
    const dataFim = new Date(ano, mes, 0, 23, 59, 59);

    return await ConsultaCirurgia.aggregate([
        {
            $match: {
                data: { $gte: dataInicio, $lte: dataFim }
            }
        },
        {
            $group: {
                _id: "$especialidade",
                tempoMedioGeral: { $avg: "$tempo_espera_cirurgia_geral" },
                tempoMedioOnco: { $avg: "$tempo_espera_cirurgia_oncologia" }
            }
        },
        {
            $project: {
                especialidade: "$_id",
                _id: 0,
                media_lista_geral: { $round: ["$tempoMedioGeral", 2] },
                media_lista_oncologica: { $round: ["$tempoMedioOnco", 2] }
            }
        },
        { $sort: { especialidade: 1 } }
    ]);
};