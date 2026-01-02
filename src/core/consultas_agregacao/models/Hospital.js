const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema({
  HospitalKey: {
    type: Number,
    required: false,
    default: null
  },

  // private key
  HospitalID: {
    type: String,
    required: true
  },


  HospitalName: {
    type: String,
    required: false,
    default: null
  },
  Description: {
    type: String,
    default: null
  },
  Address: {
    type: String,
    default: null
  },
  District: {
    type: String,
    default: null
  },
  Latitude: {
    type: Number,
    default: null
  },
  Longitude: {
    type: Number,
    default: null
  },
  NUTSIDescription: {
    type: String,
    default: null
  },
  NUTSIIDescription: {
    type: String,
    default: null
  },
  NUTSIIIDescription: {
    type: String,
    default: null
  },
  PhoneNum: {
    type: String,
    default: null
  },
  Email: {
    type: String,
    default: null
  }
}, { 
  collection: 'Hospitais',
  timestamps: true 
});

// Índices com sparse: true
HospitalSchema.index({ HospitalID: 1 }, { sparse: true });
HospitalSchema.index({ HospitalName: 1 }, { sparse: true });
HospitalSchema.index({ District: 1 }, { sparse: true });

module.exports = mongoose.model('Hospital', HospitalSchema);
