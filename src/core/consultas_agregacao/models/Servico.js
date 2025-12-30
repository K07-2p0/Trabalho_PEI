const mongoose = require('mongoose');

const ServicoSchema = new mongoose.Schema({
    nome_servico: { type: String, required: true },
    tipo: { type: String, required: true }, 
    populacao: { type: String, default: 'Todos' }
},{
    collection: 'Registos_Servico' 
});

module.exports = mongoose.model('Servico', ServicoSchema);