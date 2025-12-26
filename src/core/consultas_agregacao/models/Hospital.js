const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema({
    codigo: { type: String, required: true }, // Removi o unique para facilitar a carga inicial
    instituicao: String,
    regiao: String,
    concelho: String,
    morada: String
}, { 
    collection: 'Hospitais' // ISTO GARANTE QUE USA A TUA COLEÇÃO EXISTENTE
});

module.exports = mongoose.model('Hospital', HospitalSchema);