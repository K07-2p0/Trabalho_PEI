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

        fs.createReadStream(fullPath)
            .pipe(csv()) // Lê os headers automaticamente do CSV
            .on('data', (row) => {
                // Os dados já vêm com os headers corretos do CSV
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

        fs.createReadStream(fullPath)
            .pipe(csv())
            .on('data', (row) => {
                results.push({
                    ServiceKey: parseInt(row.ServiceKey) || null,
                    Speciality: row.Speciality || null,
                    Population: parseInt(row.Population) || null,
                    PopulationDescription: row.PopulationDescription || null,
                    SpecialityDescription: row.SpecialityDescription || null,
                    ServiceType: row.ServiceType || null
                });
            })
            .on('end', async () => {
                try {
                    await Servico.deleteMany({});
                    if (results.length > 0) {
                        await Servico.insertMany(results);
                        console.log(`    ✓ ${results.length} serviços inseridos.\n`);
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
                const dataObj = new Date(row.Date);
                
                if (isNaN(dataObj.getTime())) {
                    return; // Ignora linhas com datas inválidas
                }

                results.push({
                    Date: dataObj,
                    Hour: row.Hour || null,
                    HospitalID: row.HospitalID || null,
                    EmergencyType: row.EmergencyType || null,
                    EmergencyTypeDesc: row.EmergencyTypeDesc || null,
                    Queue1: parseInt(row.Queue1) || 0,
                    WaitingQueue1: parseInt(row.WaitingQueue1) || 0,
                    Queue2: parseInt(row.Queue2) || 0,
                    WaitingQueue2: parseInt(row.WaitingQueue2) || 0,
                    Queue3: parseInt(row.Queue3) || 0,
                    WaitingQueue3: parseInt(row.WaitingQueue3) || 0,
                    Queue4: parseInt(row.Queue4) || 0,
                    WaitingQueue4: parseInt(row.WaitingQueue4) || 0,
                    Queue5: parseInt(row.Queue5) || 0,
                    WaitingQueue5: parseInt(row.WaitingQueue5) || 0
                });
            })
            .on('end', async () => {
                try {
                    await TemposEsperaEmergencia.deleteMany({});
                    if (results.length > 0) {
                        await TemposEsperaEmergencia.insertMany(results);
                        console.log(`    ✓ ${results.length} urgências inseridas.\n`);
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

        fs.createReadStream(fullPath)
            .pipe(csv())
            .on('data', (row) => {
                results.push({
                    HospitalName: row.HospitalName || null,
                    ServiceType: row.ServiceType || null,
                    Speciality: row.Speciality || null,
                    Priority: row.Priority || null,
                    Year: parseInt(row.Year) || null,
                    WaitingUsersTotal: parseInt(row.WaitingUsersTotal) || 0
                });
            })
            .on('end', async () => {
                try {
                    await TemposEsperaConsultaCirurgia.deleteMany({});
                    if (results.length > 0) {
                        await TemposEsperaConsultaCirurgia.insertMany(results);
                        console.log(`    ✓ ${results.length} consultas/cirurgias inseridas.\n`);
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