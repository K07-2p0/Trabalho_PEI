// CODIGO_FONTE/INTEGRACAO_MONGO/scripts_carga/load_csv.js
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const connectDB = require('../db/connection');

// Carrega o .env 
require('dotenv').config({ path: path.join(__dirname, '.env') });

const loadSingleCSV = (envVarKey, collectionName, schemaDefinition) => {
    return new Promise((resolve, reject) => {
        // 1. Ler caminho relativo do .env
        const relativePathFromEnv = process.env[envVarKey];

        if (!relativePathFromEnv) {
            console.error(`>>> ERRO: Variável ${envVarKey} em falta no .env`);
            return resolve(); 
        }

        // 2. Construir caminho dinamicamente (Raiz + Caminho do .env)
        const fullPath = path.join(__dirname, '../../../', relativePathFromEnv);

        if (!fs.existsSync(fullPath)) {
            console.error(`>>> ERRO: Ficheiro não existe: ${fullPath}`);
            return resolve();
        }

        // Define o Model dinamicamente (para não criar ficheiros separados agora)
        const Model = mongoose.models[collectionName] || mongoose.model(collectionName, new mongoose.Schema(schemaDefinition, { strict: false }));
        const results = [];

        console.log(`>>> A ler: ${relativePathFromEnv}...`);

        fs.createReadStream(fullPath)
            .pipe(csv({ separator: ';' })) // ATENÇÃO: Confirma se o CSV usa ';' ou ','
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    await Model.deleteMany({});
                    if (results.length > 0) {
                        await Model.insertMany(results);
                        console.log(`>>> [SUCESSO] ${collectionName}: ${results.length} registos.`);
                    } else {
                        console.log(`>>> [AVISO] ${collectionName} vazio.`);
                    }
                    resolve();
                } catch (error) {
                    console.error(`>>> [ERRO] ${collectionName}:`, error.message);
                    resolve();
                }
            });
    });
};

const runLoader = async () => {
    await connectDB();

    // Carrega os CSVs definidos no .env
    await loadSingleCSV('PATH_CSV_HOSPITAIS', 'Hospitais', { codigo: String, instituicao: String });
    await loadSingleCSV('PATH_CSV_SERVICOS', 'Servicos', { servico: String, descricao: String });
    await loadSingleCSV('PATH_CSV_ESPERA_CONSULTA', 'HistoricoConsultas', { hospital: String, especialidade: String });
    await loadSingleCSV('PATH_CSV_ESPERA_URGENCIA', 'HistoricoUrgencias', { hospital: String, triagem: String });

    console.log('>>> Carga terminada.');
    process.exit();
};

runLoader();