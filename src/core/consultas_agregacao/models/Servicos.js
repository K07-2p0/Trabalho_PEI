const mongoose = require('mongoose');

const ServicoSchema = new mongoose.Schema({
  ServiceKey: {
    type: Number,
    required: true,
    unique: true
  },
  Speciality: {
    type: String,
    required: true
  },
  PriorityCode: String,
  PriorityDescription: String,
  TypeCode: String,
  TypeDescription: String
}, { 
  collection: 'Servicos',
  timestamps: true 
});

// Índices para otimizar consultas
ServicoSchema.index({ ServiceKey: 1 });
ServicoSchema.index({ Speciality: 1 });
ServicoSchema.index({ PriorityCode: 1 });
ServicoSchema.index({ TypeCode: 1 });

module.exports = mongoose.model('Servico', ServicoSchema);
