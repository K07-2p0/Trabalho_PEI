const mongoose = require('mongoose');

const ServicoSchema = new mongoose.Schema({
    nome_servico: { type: String, required: true },
    tipo: { type: String, enum: ['Urgência', 'Consulta', 'Cirurgia'], required: true },
    populacao: { type: String, enum: ['Adulto', 'Pediátrico', 'Todos'], default: 'Todos' }
});

module.exports = mongoose.model('Servico', ServicoSchema);