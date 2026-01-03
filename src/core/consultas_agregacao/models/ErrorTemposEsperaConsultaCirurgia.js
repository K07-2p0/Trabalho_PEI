const mongoose = require('mongoose');

const errorTemposEsperaConsultaCirurgiaSchema = new mongoose.Schema({
    HospitalName: String,
    ServiceKey: Number,
    AverageWaitingTime_Speciality_Priority_Institution: Number,
    MonthPortuguese: String,
    Year: Number,
    NumberOfPeople: Number,
    motivo_erro: String,
    campos_nulos: [String],
    data_detecao: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = errorTemposEsperaConsultaCirurgiaSchema;
