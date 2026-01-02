const mongoose = require('mongoose');

const TempoEsperaConsultaCirurgiaSchema = new mongoose.Schema({
  HospitalName: {
    type: String,
    required: true
  },
  ServiceKey: {
    type: Number,
    required: true,
    ref: 'Servico'
  },
  AverageWaitingTime_Speciality_Priority_Institution: {
    type: Number,
    required: true
  },
  MonthPortuguese: {
    type: String,
    required: true
  },
  Year: {
    type: Number,
    required: true
  },
  NumberOfPeople: {
    type: Number,
    default: 0
  }
}, { 
  collection: 'TemposEsperaConsultaCirurgia',
  timestamps: true 
});

// Índices para otimizar consultas
TempoEsperaConsultaCirurgiaSchema.index({ HospitalName: 1 });
TempoEsperaConsultaCirurgiaSchema.index({ ServiceKey: 1 });
TempoEsperaConsultaCirurgiaSchema.index({ Year: 1, MonthPortuguese: 1 });
TempoEsperaConsultaCirurgiaSchema.index({ HospitalName: 1, Year: 1, MonthPortuguese: 1 });

module.exports = mongoose.model('TempoEsperaConsultaCirurgia', TempoEsperaConsultaCirurgiaSchema);
