const mongoose = require('mongoose');

const TempoEsperaEmergenciaSchema = new mongoose.Schema({
  LastUpdate: {
    type: Date,
    required: false,
    default: null
  },
  extractionDate: {
    type: Date,
    required: false,
    default: null
  },
  institutionId: {
    type: String,
    required: false,
    default: null
  },
  EmergencyType: {
    Code: {
      type: String,
      default: null
    },
    Description: {
      type: String,
      default: null
    }
  },
  Triage: {
    Red: {
      Time: { type: Number, default: null },
      Length: { type: Number, default: null }
    },
    Orange: {
      Time: { type: Number, default: null },
      Length: { type: Number, default: null }
    },
    Yellow: {
      Time: { type: Number, default: null },
      Length: { type: Number, default: null }
    },
    Green: {
      Time: { type: Number, default: null },
      Length: { type: Number, default: null }
    },
    Blue: {
      Time: { type: Number, default: null },
      Length: { type: Number, default: null }
    }
  }
}, { 
  collection: 'TemposEsperaEmergencia',
  timestamps: true 
});

// Índices com sparse: true
TempoEsperaEmergenciaSchema.index({ institutionId: 1 }, { sparse: true });
TempoEsperaEmergenciaSchema.index({ LastUpdate: -1 }, { sparse: true });
TempoEsperaEmergenciaSchema.index({ extractionDate: -1 }, { sparse: true });
TempoEsperaEmergenciaSchema.index({ institutionId: 1, LastUpdate: -1 }, { sparse: true });

module.exports = mongoose.model('TempoEsperaEmergencia', TempoEsperaEmergenciaSchema);
