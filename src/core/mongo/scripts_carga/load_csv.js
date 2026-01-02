const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const connectDB = require('../db/connection');

require('dotenv').config({ path: path.join(__dirname, '../../../../.env') });

// Import models directly
const Hospital = require(path.join(__dirname, '../../../../src/core/consultas_agregacao/models/Hospital'));
const Servico = require(path.join(__dirname, '../../../../src/core/consultas_agregacao/models/Servicos'));
const TemposEsperaEmergencia = require(path.join(__dirname, '../../../../src/core/consultas_agregacao/models/TemposEsperaEmergencia'));
const TemposEsperaConsultaCirurgia = require(path.join(__dirname, '../../../../src/core/consultas_agregacao/models/TemposEsperaConsultaCirurgia'));

// Função para remover BOM UTF-8
const stripBOM = (content) => {
    if (content.charCodeAt(0) === 0xFEFF) {
        return content.slice(1);
    }
    return content;
};

const runLoader = async () => {
    try {
        await connectDB();
        console.log('>>> Conexão ao MongoDB estabelecida.\n');

        // --- CARGA DE HOSPITAIS ---
        await loadHospitais();
        
        // --- CARGA DE SERVIÇOS ---
        await loadServicos();
        
        // --- CARGA DE URGÊNCIAS ---
        await loadUrgencias();
        
        // --- CARGA DE CONSULTAS/CIRURGIAS ---
        await loadConsultasCirurgias();

        console.log('>>> Processo concluído com sucesso!');
        mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('>>> ERRO no processo de carga:', error);
        process.exit(1);
    }
};

const loadHospitais = () => {
    return new Promise((resolve, reject) => {
        const results = [];
        const fullPath = path.join(__dirname, '../../../../', process.env.PATH_CSV_HOSPITAIS);
        
        console.log(`>>> [1/4] A carregar Hospitais de: ${fullPath}`);

        // Lê o ficheiro completo e remove BOM
        const fileContent = stripBOM(fs.readFileSync(fullPath, 'utf8'));
        const lines = fileContent.split('\n');
        
        // Usa stream a partir do conteúdo limpo
        const { Readable } = require('stream');
        const stream = Readable.from([fileContent]);

        stream
            .pipe(csv())
            .on('data', (row) => {
                // Validação: Só adiciona se HospitalID estiver presente
                if (!row.HospitalID || row.HospitalID.trim() === '') return;
                
                results.push({
                    HospitalKey: parseInt(row.HospitalKey) || null,
                    HospitalID: row.HospitalID || '',
                    HospitalName: row.HospitalName || null,
                    Description: row.Description || null,
                    Address: row.Address || null,
                    District: row.District || null,
                    Latitude: parseFloat(row.Latitude) || null,
                    Longitude: parseFloat(row.Longitude) || null,
                    NUTSIDescription: row.NUTSIDescription || null,
                    NUTSIIDescription: row.NUTSIIDescription || null,
                    NUTSIIIDescription: row.NUTSIIIDescription || null,
                    PhoneNum: row.PhoneNum || null,
                    Email: row.Email || null
                });
            })
            .on('end', async () => {
                try {
                    await Hospital.deleteMany({});
                    if (results.length > 0) {
                        await Hospital.insertMany(results);
                        console.log(`    ✓ ${results.length} hospitais inseridos.\n`);
                    } else {
                        console.log(`    ⚠ Nenhum hospital válido encontrado.\n`);
                    }
                    resolve();
                } catch (err) {
                    console.error("    ✗ ERRO ao inserir hospitais:", err.message, '\n');
                    reject(err);
                }
            })
            .on('error', (error) => {
                console.error("    ✗ ERRO ao ler CSV de Hospitais:", error);
                reject(error);
            });
    });
};

const loadServicos = () => {
    return new Promise((resolve, reject) => {
        const results = [];
        const fullPath = path.join(__dirname, '../../../../', process.env.PATH_CSV_SERVICOS);
        
        console.log(`>>> [2/4] A carregar Serviços de: ${fullPath}`);

        // Lê o ficheiro completo e remove BOM
        const fileContent = stripBOM(fs.readFileSync(fullPath, 'utf8'));
        
        // Usa stream a partir do conteúdo limpo
        const { Readable } = require('stream');
        const stream = Readable.from([fileContent]);

        stream
            .pipe(csv())
            .on('data', (row) => {
                // Validação: ServiceKey é obrigatório e deve ser um número válido
                const serviceKey = parseInt(row.ServiceKey);
                if (!serviceKey || isNaN(serviceKey)) {
                    return; // Ignora linhas sem ServiceKey válido
                }
                
                results.push({
                    ServiceKey: serviceKey,
                    Speciality: row.Speciality || null,
                    PriorityCode: row.PriorityCode || null,
                    PriorityDescription: row.PriorityDescription || null,
                    TypeCode: row.TypeCode || null,
                    TypeDescription: row.TypeDescription || null
                });
            })
            .on('end', async () => {
                try {
                    await Servico.deleteMany({});
                    if (results.length > 0) {
                        await Servico.insertMany(results);
                        console.log(`    ✓ ${results.length} serviços inseridos.\n`);
                    } else {
                        console.log(`    ⚠ Nenhum serviço válido encontrado.\n`);
                    }
                    resolve();
                } catch (err) {
                    console.error("    ✗ ERRO ao inserir serviços:", err.message, '\n');
                    reject(err);
                }
            })
            .on('error', (error) => {
                console.error("    ✗ ERRO ao ler CSV de Serviços:", error);
                reject(error);
            });
    });
};

const loadUrgencias = () => {
    return new Promise((resolve, reject) => {
        const results = [];
        const fullPath = path.join(__dirname, '../../../../', process.env.PATH_CSV_ESPERA_URGENCIA);
        
        console.log(`>>> [3/4] A carregar Urgências de: ${fullPath}`);

        fs.createReadStream(fullPath)
            .pipe(csv())
            .on('data', (row) => {
                const lastUpdateDate = new Date(row.LastUpdate);
                const extractionDate = new Date(row.extractionDate);
                
                // Validação: Ignora linhas com datas inválidas ou sem institutionId
                if (isNaN(lastUpdateDate.getTime()) || !row.institutionId) {
                    return;
                }

                results.push({
                    LastUpdate: lastUpdateDate,
                    extractionDate: extractionDate,
                    institutionId: row.institutionId,
                    EmergencyType: {
                        Code: row['EmergencyType.Code'] || null,
                        Description: row['EmergencyType.Description'] || null
                    },
                    Triage: {
                        Red: {
                            Time: parseInt(row['Triage.Red.Time']) || 0,
                            Length: parseInt(row['Triage.Red.Length']) || 0
                        },
                        Orange: {
                            Time: parseInt(row['Triage.Orange.Time']) || 0,
                            Length: parseInt(row['Triage.Orange.Length']) || 0
                        },
                        Yellow: {
                            Time: parseInt(row['Triage.Yellow.Time']) || 0,
                            Length: parseInt(row['Triage.Yellow.Length']) || 0
                        },
                        Green: {
                            Time: parseInt(row['Triage.Green.Time']) || 0,
                            Length: parseInt(row['Triage.Green.Length']) || 0
                        },
                        Blue: {
                            Time: parseInt(row['Triage.Blue.Time']) || 0,
                            Length: parseInt(row['Triage.Blue.Length']) || 0
                        }
                    }
                });
            })
            .on('end', async () => {
                try {
                    await TemposEsperaEmergencia.deleteMany({});
                    if (results.length > 0) {
                        await TemposEsperaEmergencia.insertMany(results);
                        console.log(`    ✓ ${results.length} urgências inseridas.\n`);
                    } else {
                        console.log(`    ⚠ Nenhuma urgência válida encontrada.\n`);
                    }
                    resolve();
                } catch (err) {
                    console.error("    ✗ ERRO ao inserir urgências:", err.message, '\n');
                    reject(err);
                }
            })
            .on('error', (error) => {
                console.error("    ✗ ERRO ao ler CSV de Urgências:", error);
                reject(error);
            });
    });
};



const loadConsultasCirurgias = () => {
    return new Promise((resolve, reject) => {
        const results = [];
        const fullPath = path.join(__dirname, '../../../../', process.env.PATH_CSV_ESPERA_CONSULTA);
        
        console.log(`>>> [4/4] A carregar Consultas/Cirurgias de: ${fullPath}`);

        // Lê o ficheiro completo e remove BOM
        const fileContent = stripBOM(fs.readFileSync(fullPath, 'utf8'));
        
        // Usa stream a partir do conteúdo limpo
        const { Readable } = require('stream');
        const stream = Readable.from([fileContent]);

        stream
            .pipe(csv())
            .on('data', (row) => {
                // Validação: pelo menos HospitalName deve existir
                if (!row.HospitalName || row.HospitalName.trim() === '') {
                    return;
                }
                
                results.push({
                    HospitalName: row.HospitalName || null,
                    ServiceKey: parseInt(row.ServiceKey) || null,
                    AverageWaitingTime_Speciality_Priority_Institution: parseFloat(row.AverageWaitingTime_Speciality_Priority_Institution) || null,
                    MonthPortuguese: row.MonthPortuguese || null,
                    Year: parseInt(row.Year) || null,
                    NumberOfPeople: parseInt(row.NumberOfPeople) || 0
                });
            })
            .on('end', async () => {
                try {
                    await TemposEsperaConsultaCirurgia.deleteMany({});
                    if (results.length > 0) {
                        await TemposEsperaConsultaCirurgia.insertMany(results);
                        console.log(`    ✓ ${results.length} consultas/cirurgias inseridas.\n`);
                    } else {
                        console.log(`    ⚠ Nenhuma consulta/cirurgia válida encontrada.\n`);
                    }
                    resolve();
                } catch (err) {
                    console.error("    ✗ ERRO ao inserir consultas/cirurgias:", err.message, '\n');
                    reject(err);
                }
            })
            .on('error', (error) => {
                console.error("    ✗ ERRO ao ler CSV de Consultas/Cirurgias:", error);
                reject(error);
            });
    });
};

runLoader();
