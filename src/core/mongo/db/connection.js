// CODIGO_FONTE/INTEGRACAO_MONGO/db/connection.js
const mongoose = require('mongoose');
const path = require('path');

// ALTERAÇÃO IMPORTANTE: 
// Indica explicitamente onde está o ficheiro .env (3 pastas acima)
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    // Agora ele consegue ler o MONGO_URI do ficheiro .env na raiz
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/HealthTimeDB';

    try {
        await mongoose.connect(uri);
        console.log('>>> MongoDB Conectado com Sucesso!');
    } catch (err) {
        console.error('>>> Erro ao conectar ao MongoDB:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;