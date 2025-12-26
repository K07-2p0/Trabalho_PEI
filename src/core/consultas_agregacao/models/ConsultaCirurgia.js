const mongoose = require('mongoose');

const ConsultaCirurgiaSchema = new mongoose.Schema({
    hospital_id: String,
    tipo: String, // Removemos o enum: ['Consulta', 'Cirurgia'] para aceitar os códigos do CSV
    especialidade: String,
    populacao: String,
    prioridade: String,
    lista_espera_total: Number,
    tempo_medio_resposta: Number,
    oncológica: { type: Boolean, default: false }
},{
    collection: 'Registos_ConsultaCirurgia'
});

module.exports = mongoose.model('ConsultaCirurgia', ConsultaCirurgiaSchema);