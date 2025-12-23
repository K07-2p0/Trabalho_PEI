const mongoose = require('mongoose');

const ConsultaCirurgiaSchema = new mongoose.Schema({
    hospital_id: String,
    tipo: { type: String, enum: ['Consulta', 'Cirurgia'] },
    especialidade: String,
    populacao: String, // Adulto/Criança
    prioridade: String, // Normal, Prioritário, etc
    lista_espera_total: Number,
    tempo_medio_resposta: Number,
    oncológica: { type: Boolean, default: false }
});

module.exports = mongoose.model('ConsultaCirurgia', ConsultaCirurgiaSchema);