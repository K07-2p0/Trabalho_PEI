// 32_INTEGRACAO_MONGO/db/connection.js
const mongoose = require('mongoose');
require('dotenv').config(); // Para ler variáveis de ambiente se existirem

// URL de conexão (Pode vir de um ficheiro .env ou hardcoded para testes locais)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/HealthTimeDB';

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            // Opções modernas do driver MongoDB (algumas já são default nas versões novas)
            serverSelectionTimeoutMS: 5000
        });
        console.log('>>> MongoDB Conectado com Sucesso!');
    } catch (err) {
        console.error('>>> Erro ao conectar ao MongoDB:', err.message);
        // Encerra o processo se a conexão falhar
        process.exit(1);
    }
};

module.exports = connectDB;