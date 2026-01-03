require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - ORDEM IMPORTA!
app.use(express.json());

// Middleware específico para XML
app.use(express.text({ 
    type: ['application/xml', 'text/xml'],
    limit: '10mb'
}));

// Middleware adicional para garantir que XML é texto
app.use((req, res, next) => {
    const contentType = req.get('Content-Type');
    if (contentType && (contentType.includes('xml') || contentType.includes('XML'))) {
        if (typeof req.body === 'object' && req.body !== null) {
            // Se veio como objeto, converter para string
            req.body = req.body.toString();
        }
    }
    next();
});

// Conectar MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('>>> MongoDB conectado com sucesso'))
    .catch(err => console.error('Erro ao conectar MongoDB:', err));

// Importar Rotas
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