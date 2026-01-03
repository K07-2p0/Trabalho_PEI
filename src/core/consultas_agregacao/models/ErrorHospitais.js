const mongoose = require('mongoose');

const errorHospitalSchema = new mongoose.Schema({
    HospitalKey: Number,
    HospitalID: String,
    HospitalName: String,
    Description: String,
    Address: String,
    District: String,
    Latitude: Number,
    Longitude: Number,
    NUTSIDescription: String,
    NUTSIIDescription: String,
    NUTSIIIDescription: String,
    PhoneNum: String,
    Email: String,
    motivo_erro: String,
    campos_nulos: [String],
    data_detecao: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = errorHospitalSchema;
