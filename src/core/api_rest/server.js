require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.text({ type: 'application/xml' }));

// Conectar MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('>>> MongoDB conectado com sucesso'))
    .catch(err => console.error('Erro ao conectar MongoDB:', err));

// Importar Rotas (APENAS as rotas, não as pipelines)
const submissaoRoutes = require('./routes/submissao');
const relatoriosRoutes = require('./routes/relatorios');

// Usar Rotas
app.use('/submissao', submissaoRoutes);
app.use('/relatorios', relatoriosRoutes);

// Rota raiz
app.get('/', (req, res) => {
    res.json({ mensagem: 'API HealthTime funcionando!' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`>>> Servidor API REST a correr na porta ${PORT}`);
});