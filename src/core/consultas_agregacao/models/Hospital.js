const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema({
  HospitalKey: {
    type: Number,
    required: true,
    unique: true
  },
  HospitalID: {
    type: String,
    required: true,
    unique: true
  },
  HospitalName: {
    type: String,
    required: true
  },
  Description: String,
  Address: String,
  District: String,
  Latitude: Number,
  Longitude: Number,
  NUTSIDescription: String,
  NUTSIIDescription: String,
  NUTSIIIDescription: String,
  PhoneNum: String,
  Email: String
}, { 
  collection: 'Hospitais',
  timestamps: true 
});

// Índices para otimizar consultas
HospitalSchema.index({ HospitalID: 1 });
HospitalSchema.index({ HospitalName: 1 });
HospitalSchema.index({ District: 1 });

module.exports = mongoose.model('Hospital', HospitalSchema);
