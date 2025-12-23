const express = require('express');
const path = require('path');
// Carrega o .env da raiz do projeto (recua 2 níveis de API_REST até Trabalho_PEI)
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const connectDB = require('../INTEGRACAO_MONGO/db/connection');
const submissaoRoutes = require('./routes/submissao');
const relatoriosRoutes = require('./routes/relatorios');

const app = express();

// Middleware para aceitar o corpo do pedido como texto (essencial para receber XML via POST)
app.use(express.text({ type: ['application/xml', 'text/xml'], limit: '10mb' }));
app.use(express.json());

// Inicializa a conexão ao MongoDB
connectDB();

// Definição dos Endpoints base
app.use('/submissao', submissaoRoutes);
app.use('/relatorios', relatoriosRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`>>> Servidor API REST a correr na porta ${PORT}`);
});