const mongoose = require('mongoose');

const ServicoSchema = new mongoose.Schema({

  // private key
  ServiceKey: {
    type: Number,
    required: true
  },
  Speciality: {
    type: String,
    required: false,
    default: null
  },
  PriorityCode: {
    type: String,
    default: null
  },
  PriorityDescription: {
    type: String,
    default: null
  },
  TypeCode: {
    type: String,
    default: null
  },
  TypeDescription: {
    type: String,
    default: null
  }
}, { 
  collection: 'Servicos',
  timestamps: true 
});

// Índices com sparse: true
ServicoSchema.index({ ServiceKey: 1 }, { sparse: true });
ServicoSchema.index({ Speciality: 1 }, { sparse: true });
ServicoSchema.index({ PriorityCode: 1 }, { sparse: true });
ServicoSchema.index({ TypeCode: 1 }, { sparse: true });

module.exports = mongoose.model('Servico', ServicoSchema);
