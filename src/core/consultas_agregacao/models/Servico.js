const mongoose = require('mongoose');

const ServicoSchema = new mongoose.Schema({
    nome_servico: { type: String, required: true },
    tipo: { type: String, required: true }, // Removido o enum para evitar erros de validação
    populacao: { type: String, default: 'Todos' } // Removido o enum
},{
    collection: 'Registos_Servico' 
});

module.exports = mongoose.model('Servico', ServicoSchema);