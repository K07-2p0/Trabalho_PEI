// CODIGO_FONTE/INTEGRACAO_MONGO/scripts_carga/load_csv.js
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const connectDB = require('../db/connection');

// Carrega o .env (3 níveis acima)
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const loadSingleCSV = (envVarKey, collectionName, schemaDefinition) => {
    return new Promise((resolve, reject) => {
        
        // 1. Chama a variável do .env
        const envVarPath = process.env[envVarKey];

        if (!envVarPath) {
            console.error(`>>> ERRO: Variável ${envVarKey} não encontrada no .env`);
            return resolve(); // Resolve para não bloquear os outros ficheiros
        }

        // 2. Resolver caminho (Recua 4 níveis para compensar o "./Trabalho_PEI/" no path)
        const fullPath = path.join(__dirname, '../../../../', envVarPath);

        if (!fs.existsSync(fullPath)) {
            console.error(`>>> ERRO: Ficheiro não existe: ${fullPath}`);
            return resolve();
        }

        // Define o Model dinamicamente
        const Model = mongoose.models[collectionName] || mongoose.model(collectionName, new mongoose.Schema(schemaDefinition, { strict: false }));
        const results = [];

        console.log(`>>> A carregar ${collectionName}...`);

        fs.createReadStream(fullPath)
            .pipe(csv({ separator: ';' })) // Assume separador ';' (comum em CSVs portugueses)
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    await Model.deleteMany({}); // Limpa dados antigos
                    if (results.length > 0) {
                        await Model.insertMany(results);
                        console.log(`>>> [SUCESSO] ${collectionName}: ${results.length} registos inseridos.`);
                    } else {
                        console.log(`>>> [AVISO] ${collectionName}: O ficheiro estava vazio.`);
                    }
                    resolve();
                } catch (error) {
                    console.error(`>>> [ERRO] Falha ao inserir ${collectionName}:`, error.message);
                    resolve();
                }
            });
    });
};

const runLoader = async () => {
    await connectDB();

    // Executa a carga para as 4 variáveis definidas no teu .env
    
    // 1. Hospitais
    await loadSingleCSV('PATH_CSV_HOSPITAIS', 'Hospitais', { codigo: String, instituicao: String });
    
    // 2. Serviços
    await loadSingleCSV('PATH_CSV_SERVICOS', 'Servicos', { servico: String, descricao: String });
    
    // 3. Tempos Espera Consulta
    await loadSingleCSV('PATH_CSV_ESPERA_CONSULTA', 'HistoricoConsultas', { hospital: String, especialidade: String });

    // 4. Tempos Espera Urgência
    await loadSingleCSV('PATH_CSV_ESPERA_URGENCIA', 'HistoricoUrgencias', { hospital: String, triagem: String });

    console.log('>>> Processo de carga terminado.');
    process.exit();
};

runLoader();