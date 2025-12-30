const mongoose = require('mongoose');

const erroIntegracaoSchema = new mongoose.Schema({
    tipo: {
        type: String,
        enum: ['urgencia', 'consulta', 'cirurgia', 'validacao', 'transformacao', 'persistencia'],
        required: true
    },
    mensagemErro: {
        type: String,
        required: true
    },
    xmlOriginal: {
        type: String,
        required: false
    },
    detalhesErro: {
        type: mongoose.Schema.Types.Mixed,
        required: false
    },
    dataOcorrencia: {
        type: Date,
        default: Date.now
    },
    resolvido: {
        type: Boolean,
        default: false
    },
    dataResolucao: {
        type: Date,
        required: false
    },
    observacoes: {
        type: String,
        required: false
    }
}, {
    timestamps: true,
    collection: 'erros_integracao'
});

// Índice para consultas eficientes
erroIntegracaoSchema.index({ tipo: 1, resolvido: 1, dataOcorrencia: -1 });

module.exports = mongoose.model('ErroIntegracao', erroIntegracaoSchema);