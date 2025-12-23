// CODIGO_FONTE/INTEGRACAO_MONGO/db/connection.js
const mongoose = require('mongoose');
const path = require('path');

// 1. Configura o dotenv para ler o ficheiro na raiz do projeto (3 níveis acima)
// Estrutura: db -> INTEGRACAO_MONGO -> CODIGO_FONTE -> Trabalho_PEI (.env está aqui)
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const connectDB = async () => {
    // 2. Chama a variável MONGO_URI definida no .env
    const uri = process.env.MONGO_URI;

    if (!uri) {
        console.error('>>> ERRO: A variável MONGO_URI não está definida no ficheiro .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        console.log('>>> MongoDB Conectado com Sucesso (Atlas)!');
    } catch (err) {
        console.error('>>> Erro ao conectar ao MongoDB:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;