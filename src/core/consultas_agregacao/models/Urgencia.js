const mongoose = require('mongoose');

const UrgenciaSchema = new mongoose.Schema({
    hospital_id: String, // Liga ao código do Hospital
    data_registo: { type: Date, required: true },
    tipologia: String,
    estado: String, // Aberta/Fechada
    triagem: String, // Escala de Manchester (Vermelho, Laranja, etc)
    utentes_em_espera: { type: Number, default: 0 },
    tempo_medio_espera: { type: Number, default: 0 }
},{
    collection: 'Registos_Urgencia' // ISTO GARANTE QUE USA A TUA COLEÇÃO EXISTENTE
});

module.exports = mongoose.model('Urgencia', UrgenciaSchema);