const mongoose = require('mongoose');

const errorServicoSchema = new mongoose.Schema({
    ServiceKey: Number,
    Speciality: String,
    PriorityCode: String,
    PriorityDescription: String,
    TypeCode: String,
    TypeDescription: String,
    motivo_erro: String,
    campos_nulos: [String],
    data_detecao: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = errorServicoSchema;
