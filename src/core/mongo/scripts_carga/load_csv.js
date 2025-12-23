const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const connectDB = require('../db/connection');

// 1. Carrega o .env (Ajusta o recuo conforme a profundidade da pasta: src/core/mongo/scripts_carga = 4 níveis)
require('dotenv').config({ path: path.join(__dirname, '../../../../.env') });

/**
 * Função auxiliar para importar um Modelo dinamicamente com base no caminho do .env
 * @param {string} modelFileName - O nome do ficheiro (ex: 'Hospital')
 * @returns {mongoose.Model} - O modelo Mongoose carregado
 */
const getModelFromEnv = (modelFileName) => {
    const relativeModelPath = process.env.PATH_MODELS;

    if (!relativeModelPath) {
        console.error('>>> ERRO CRÍTICO: Variável PATH_MODELS não definida no .env');
        process.exit(1);
    }

    // Resolve o caminho absoluto: Raiz do Projeto + Caminho do .env
    // Nota: O recuo '../../../../' leva-nos à raiz onde o comando node é executado (geralmente)
    // Se o PATH_MODELS já inclui "Trabalho_PEI", temos de garantir que estamos na pasta pai disso.
    const fullPath = path.join(__dirname, '../../../../', relativeModelPath, modelFileName);

    try {
        return require(fullPath);
    } catch (error) {
        console.error(`>>> ERRO ao importar modelo de: ${fullPath}`);
        console.error(error.message);
        process.exit(1);
    }
};

/**
 * Carrega um único CSV para uma Coleção/Modelo
 */
const loadSingleCSV = (envVarKey, Model) => {
    return new Promise((resolve, reject) => {
        
        // Ler caminho do CSV do .env
        const csvRelativePath = process.env[envVarKey];

        if (!csvRelativePath) {
            console.error(`>>> ERRO: Variável ${envVarKey} não encontrada no .env`);
            return resolve(); 
        }

        const fullCsvPath = path.join(__dirname, '../../../../', csvRelativePath);

        if (!fs.existsSync(fullCsvPath)) {
            console.error(`>>> ERRO: Ficheiro CSV não existe: ${fullCsvPath}`);
            return resolve();
        }

        const results = [];
        console.log(`>>> A carregar dados para o modelo [${Model.modelName}]...`);

        fs.createReadStream(fullCsvPath)
            .pipe(csv({ separator: ';' })) 
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    // Limpa a coleção atual
                    await Model.deleteMany({}); 
                    
                    if (results.length > 0) {
                        // Insere os novos dados
                        await Model.insertMany(results);
                        console.log(`>>> [SUCESSO] ${Model.modelName}: ${results.length} registos inseridos.`);
                    } else {
                        console.log(`>>> [AVISO] O ficheiro CSV para ${Model.modelName} estava vazio.`);
                    }
                    resolve();
                } catch (error) {
                    console.error(`>>> [ERRO] Falha ao inserir em ${Model.modelName}:`, error.message);
                    resolve();
                }
            });
    });
};

const runLoader = async () => {
    // Conectar à BD
    await connectDB();

    console.log('>>> A importar modelos dinamicamente via .env...');

    // 2. Importar os Modelos usando a função auxiliar
    // Certifica-te que os nomes dos ficheiros (ex: 'Hospital') batem certo com o que está na pasta models
    const HospitalModel = getModelFromEnv('Hospital');
    const ServicoModel = getModelFromEnv('Servico');
    const UrgenciaModel = getModelFromEnv('Urgencia'); 
    const ConsultaCirurgiaModel = getModelFromEnv('ConsultaCirurgia'); 

    // 3. Executar a Carga (Mapeamento: Variável ENV do CSV -> Modelo Importado)
    
    // Carregar Hospitais
    await loadSingleCSV('PATH_CSV_HOSPITAIS', HospitalModel);
    
    // Carregar Serviços
    await loadSingleCSV('PATH_CSV_SERVICOS', ServicoModel);
    
    // Carregar Histórico de Consultas/Cirurgias
    // Nota: Assume que o modelo ConsultaCirurgia está preparado para receber estes dados
    await loadSingleCSV('PATH_CSV_ESPERA_CONSULTA', ConsultaCirurgiaModel);

    // Carregar Histórico de Urgências
    await loadSingleCSV('PATH_CSV_ESPERA_URGENCIA', UrgenciaModel);

    console.log('>>> Processo de carga terminado.');
    process.exit();
};

runLoader();