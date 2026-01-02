const mongoose = require('mongoose');

const TempoEsperaEmergenciaSchema = new mongoose.Schema({
  LastUpdate: {
    type: Date,
    required: true
  },
  extractionDate: {
    type: Date,
    required: true
  },
  institutionId: {
    type: String,
    required: true
  },
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
  }
}, { 
  collection: 'TemposEsperaEmergencia',
  timestamps: true 
});

// Índices para otimizar consultas
TempoEsperaEmergenciaSchema.index({ institutionId: 1 });
TempoEsperaEmergenciaSchema.index({ LastUpdate: -1 });
TempoEsperaEmergenciaSchema.index({ extractionDate: -1 });
TempoEsperaEmergenciaSchema.index({ institutionId: 1, LastUpdate: -1 });

module.exports = mongoose.model('TempoEsperaEmergencia', TempoEsperaEmergenciaSchema);
