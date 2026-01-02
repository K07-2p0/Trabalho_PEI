const mongoose = require('mongoose');

const TempoEsperaConsultaCirurgiaSchema = new mongoose.Schema({
  HospitalName: {
    type: String,
    required: false, 
    default: null
  },
  ServiceKey: {
    type: Number,
    required: false, 
    ref: 'Servico',
    default: null
  },
  AverageWaitingTime_Speciality_Priority_Institution: {
    type: Number,
    required: false,  
    default: null
  },
  MonthPortuguese: {
    type: String,
    required: false,  
    default: null
  },
  Year: {
    type: Number,
    required: false,
    default: null
  },
  NumberOfPeople: {
    type: Number,
    default: 0
  }
}, { 
  collection: 'TemposEsperaConsultaCirurgia',
  timestamps: true 
});

// Índices para otimizar consultas (com sparse: true para permitir null)
TempoEsperaConsultaCirurgiaSchema.index({ HospitalName: 1 }, { sparse: true });
TempoEsperaConsultaCirurgiaSchema.index({ ServiceKey: 1 }, { sparse: true });
TempoEsperaConsultaCirurgiaSchema.index({ Year: 1, MonthPortuguese: 1 }, { sparse: true });
TempoEsperaConsultaCirurgiaSchema.index({ HospitalName: 1, Year: 1, MonthPortuguese: 1 }, { sparse: true });

module.exports = mongoose.model('TempoEsperaConsultaCirurgia', TempoEsperaConsultaCirurgiaSchema);
