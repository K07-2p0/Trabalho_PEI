const getEvolucaoEPicosUrgenciaGeral = async (dataDia) => {
    const inicio = new Date(dataDia); inicio.setHours(0,0,0,0);
    const fim = new Date(dataDia); fim.setHours(23,59,59,999);

    const evolucao = await Urgencia.aggregate([
        {
            $match: {
                tipo_urgencia: { $regex: /geral/i },
                data_registo: { $gte: inicio, $lte: fim }
            }
        },
        {
            // Agrupar em intervalos de 15 minutos
            $group: {
                _id: {
                    hora: { $hour: "$data_registo" },
                    minuto: { 
                        $subtract: [
                            { $minute: "$data_registo" }, 
                            { $mod: [{ $minute: "$data_registo" }, 15] }
                        ] 
                    }
                },
                mediaEspera: { $avg: "$tempo_espera" },
                totalUtentes: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                intervalo: { 
                    $concat: [
                        { $toString: "$_id.hora" }, ":", 
                        { $cond: [{ $eq: ["$_id.minuto", 0]}, "00", { $toString: "$_id.minuto" }] }
                    ] 
                },
                media_espera: { $round: ["$mediaEspera", 2] },
                afluencia: "$totalUtentes"
            }
        },
        { $sort: { intervalo: 1 } }
    ]);

    // Calcular os 3 picos de afluência a partir dos resultados
    const picos = [...evolucao]
        .sort((a, b) => b.afluencia - a.afluencia)
        .slice(0, 3);

    return {
        timeline: evolucao,
        top_picos: picos
    };
};