const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema({
    codigo: { type: String, required: true, unique: true },
    instituicao: String,
    regiao: String,
    concelho: String,
    morada: String
});

module.exports = mongoose.model('Hospital', HospitalSchema);