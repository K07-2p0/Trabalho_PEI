// 32_INTEGRACAO_MONGO/scripts_carga/load_csv.js
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const connectDB = require('/db/connection');
const mongoose = require('mongoose');

// Definir um Schema temporário ou importar o Model de Hospitais se já existir
const HospitalSchema = new mongoose.Schema({
    codigo: String,
    instituicao: String,
    regiao: String,
    concelho: String
}, { strict: false });

const HospitalModel = mongoose.model('Hospitais', HospitalSchema);

// Caminho para o CSV (ajustar conforme a estrutura)
const CSV_FILE_PATH = path.join(__dirname, '/20_DADOS_VOCABULARIO/23_DADOS_INICIAIS/Hospitais.csv');

const loadHospitais = async () => {
    await connectDB();

    const results = [];

    console.log(`>>> A ler ficheiro: ${CSV_FILE_PATH}`);

    fs.createReadStream(CSV_FILE_PATH)
        .pipe(csv({ separator: ';' })) // Ajustar separador se for vírgula ou ponto-e-vírgula
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            try {
                // Limpa a coleção antes de carregar (opcional)
                await HospitalModel.deleteMany({}); 
                console.log('>>> Coleção limpa.');

                // Insere os dados
                await HospitalModel.insertMany(results);
                console.log(`>>> Sucesso! ${results.length} hospitais carregados.`);
                
                process.exit();
            } catch (error) {
                console.error('>>> Erro ao inserir dados:', error);
                process.exit(1);
            }
        });
};

// Executar o script
loadHospitais();