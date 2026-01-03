require('dotenv').config();
const mongoose = require('mongoose');

const connectErrorDB = async () => {
    try {
        // Criar uma conexão separada para a base de dados de Erros
        const errorConnection = await mongoose.createConnection(process.env.MONGO_ERROR_URI);
        
        console.log('MongoDB Erros conectado com sucesso!');
        return errorConnection;
    } catch (error) {
        console.error('Erro ao conectar ao MongoDB Erros:', error);
        process.exit(1);
    }
};

module.exports = connectErrorDB;

