const mongoose = require('mongoose');

const errorTemposEsperaEmergenciaSchema = new mongoose.Schema({
    LastUpdate: Date,
    extractionDate: Date,
    institutionId: String,
    EmergencyType: {
        Code: String,
        Description: String
    },
    Triage: {
        Red: {
            Time: Number,
            Length: Number
        },
        Orange: {
            Time: Number,
            Length: Number
        },
        Yellow: {
            Time: Number,
            Length: Number
        },
        Green: {
            Time: Number,
            Length: Number
        },
        Blue: {
            Time: Number,
            Length: Number
        }
    },
    motivo_erro: String,
    campos_nulos: [String],
    data_detecao: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = errorTemposEsperaEmergenciaSchema;
