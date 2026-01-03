const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const connectDB = require('../db/connection');
const connectErrorDB = require('../db/connectionErrors');

require('dotenv').config({ path: path.join(__dirname, '../../../../.env') });

// Import models principais (usam conexão default - HealthTime)
const Hospital = require(path.join(__dirname, '../../../../src/core/consultas_agregacao/models/Hospital'));
const Servico = require(path.join(__dirname, '../../../../src/core/consultas_agregacao/models/Servicos'));
const TemposEsperaEmergencia = require(path.join(__dirname, '../../../../src/core/consultas_agregacao/models/TemposEsperaEmergencia'));
const TemposEsperaConsultaCirurgia = require(path.join(__dirname, '../../../../src/core/consultas_agregacao/models/TemposEsperaConsultaCirurgia'));

// Import schemas de erros (vamos criar models com conexão separada)
const errorHospitalSchema = require(path.join(__dirname, '../../../../src/core/consultas_agregacao/models/ErrorHospitais'));
const errorServicoSchema = require(path.join(__dirname, '../../../../src/core/consultas_agregacao/models/ErrorServicos'));
const errorTemposEsperaEmergenciaSchema = require(path.join(__dirname, '../../../../src/core/consultas_agregacao/models/ErrorTemposEsperaEmergencia'));
const errorTemposEsperaConsultaCirurgiaSchema = require(path.join(__dirname, '../../../../src/core/consultas_agregacao/models/ErrorTemposEsperaConsultaCirurgia'));

// Variáveis globais para os models de erro
let ErrorHospital, ErrorServico, ErrorTemposEsperaEmergencia, ErrorTemposEsperaConsultaCirurgia;

// Função para remover BOM UTF-8
const stripBOM = (content) => {
    if (content.charCodeAt(0) === 0xFEFF) {
        return content.slice(1);
    }
    return content;
};

// Função para verificar se um valor é nulo/vazio
const isNullOrEmpty = (value) => {
    return value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '');
};

const runLoader = async () => {
    let errorConnection;
    
    try {
        // Conectar à base de dados principal (HealthTime)
        await connectDB();
        console.log('>>> Conexão ao MongoDB HealthTime estabelecida.\n');

        // Conectar à base de dados de erros (Erros)
        errorConnection = await connectErrorDB();
        console.log('>>> Conexão ao MongoDB Erros estabelecida.\n');

        // Criar models de erro usando a conexão separada
        ErrorHospital = errorConnection.model('ErrorHospital', errorHospitalSchema, 'error_Hospitais');
        ErrorServico = errorConnection.model('ErrorServico', errorServicoSchema, 'error_Servicos');
        ErrorTemposEsperaEmergencia = errorConnection.model('ErrorTemposEsperaEmergencia', errorTemposEsperaEmergenciaSchema, 'error_TemposEsperaEmergencia');
        ErrorTemposEsperaConsultaCirurgia = errorConnection.model('ErrorTemposEsperaConsultaCirurgia', errorTemposEsperaConsultaCirurgiaSchema, 'error_TemposEsperaConsultaCirurgia');

        // Limpar todas as coleções
        console.log('>>> A limpar coleções...');
        await Hospital.deleteMany({});
        await Servico.deleteMany({});
        await TemposEsperaEmergencia.deleteMany({});
        await TemposEsperaConsultaCirurgia.deleteMany({});
        await ErrorHospital.deleteMany({});
        await ErrorServico.deleteMany({});
        await ErrorTemposEsperaEmergencia.deleteMany({});
        await ErrorTemposEsperaConsultaCirurgia.deleteMany({});
        
        console.log('>>> Todas as coleções limpas.\n');

        // --- CARGA DE HOSPITAIS ---
        await loadHospitais();
        
        // --- CARGA DE SERVIÇOS ---
        await loadServicos();
        
        // --- CARGA DE URGÊNCIAS ---
        await loadUrgencias();
        
        // --- CARGA DE CONSULTAS/CIRURGIAS ---
        await loadConsultasCirurgias();

        // Resumo final
        console.log('\n=== RESUMO FINAL ===');
        console.log('\n📊 Base de Dados: HealthTime (Dados Válidos)');
        console.log(`   - Hospitais: ${await Hospital.countDocuments()}`);
        console.log(`   - Serviços: ${await Servico.countDocuments()}`);
        console.log(`   - Urgências: ${await TemposEsperaEmergencia.countDocuments()}`);
        console.log(`   - Consultas/Cirurgias: ${await TemposEsperaConsultaCirurgia.countDocuments()}`);
        
        console.log('\n⚠️  Base de Dados: Erros (Dados com Problemas)');
        console.log(`   - error_Hospitais: ${await ErrorHospital.countDocuments()}`);
        console.log(`   - error_Servicos: ${await ErrorServico.countDocuments()}`);
        console.log(`   - error_TemposEsperaEmergencia: ${await ErrorTemposEsperaEmergencia.countDocuments()}`);
        console.log(`   - error_TemposEsperaConsultaCirurgia: ${await ErrorTemposEsperaConsultaCirurgia.countDocuments()}`);

        console.log('\n>>> Processo concluído com sucesso!');
        
        // Fechar ambas as conexões
        await mongoose.connection.close();
        await errorConnection.close();
        process.exit(0);
    } catch (error) {
        console.error('>>> ERRO no processo de carga:', error);
        if (errorConnection) {
            await errorConnection.close();
        }
        process.exit(1);
    }
};

const loadHospitais = () => {
    return new Promise((resolve, reject) => {
        const validResults = [];
        const errorResults = [];
        const fullPath = path.join(__dirname, '../../../../', process.env.PATH_CSV_HOSPITAIS);
        
        console.log(`>>> [1/4] A carregar Hospitais de: ${fullPath}`);

        const fileContent = stripBOM(fs.readFileSync(fullPath, 'utf8'));
        const { Readable } = require('stream');
        const stream = Readable.from([fileContent]);

        stream
            .pipe(csv())
            .on('data', (row) => {
                // Verificar campos obrigatórios e nulos
                const camposNulos = [];
                
                if (isNullOrEmpty(row.HospitalID)) camposNulos.push('HospitalID');
                if (isNullOrEmpty(row.HospitalName)) camposNulos.push('HospitalName');
                if (isNullOrEmpty(row.Address)) camposNulos.push('Address');
                if (isNullOrEmpty(row.District)) camposNulos.push('District');
                if (isNullOrEmpty(row.Email)) camposNulos.push('Email');
                if (isNullOrEmpty(row.PhoneNum)) camposNulos.push('PhoneNum');
                if (row.Latitude === null || row.Latitude === '' || isNaN(parseFloat(row.Latitude))) camposNulos.push('Latitude');
                if (row.Longitude === null || row.Longitude === '' || isNaN(parseFloat(row.Longitude))) camposNulos.push('Longitude');

                // Se tem campos nulos, vai para BD Erros
                if (camposNulos.length > 0) {
                    errorResults.push({
                        HospitalKey: parseInt(row.HospitalKey) || null,
                        HospitalID: row.HospitalID || null,
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
                        Email: row.Email || null,
                        motivo_erro: `Campos com dados em falta: ${camposNulos.join(', ')}`,
                        campos_nulos: camposNulos
                    });
                } else {
                    // Dados completos, vai para BD HealthTime
                    validResults.push({
                        HospitalKey: parseInt(row.HospitalKey),
                        HospitalID: row.HospitalID,
                        HospitalName: row.HospitalName,
                        Description: row.Description || null,
                        Address: row.Address,
                        District: row.District,
                        Latitude: parseFloat(row.Latitude),
                        Longitude: parseFloat(row.Longitude),
                        NUTSIDescription: row.NUTSIDescription || null,
                        NUTSIIDescription: row.NUTSIIDescription || null,
                        NUTSIIIDescription: row.NUTSIIIDescription || null,
                        PhoneNum: row.PhoneNum,
                        Email: row.Email
                    });
                }
            })
            .on('end', async () => {
                try {
                    if (validResults.length > 0) {
                        await Hospital.insertMany(validResults);
                        console.log(`    ✓ ${validResults.length} hospitais válidos → BD HealthTime`);
                    }
                    if (errorResults.length > 0) {
                        await ErrorHospital.insertMany(errorResults);
                        console.log(`    ⚠ ${errorResults.length} hospitais com erros → BD Erros\n`);
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
        const validResults = [];
        const errorResults = [];
        const fullPath = path.join(__dirname, '../../../../', process.env.PATH_CSV_SERVICOS);
        
        console.log(`>>> [2/4] A carregar Serviços de: ${fullPath}`);

        const fileContent = stripBOM(fs.readFileSync(fullPath, 'utf8'));
        const { Readable } = require('stream');
        const stream = Readable.from([fileContent]);

        stream
            .pipe(csv())
            .on('data', (row) => {
                const camposNulos = [];
                const serviceKey = parseInt(row.ServiceKey);
                
                if (!serviceKey || isNaN(serviceKey)) camposNulos.push('ServiceKey');
                if (isNullOrEmpty(row.Speciality)) camposNulos.push('Speciality');
                if (isNullOrEmpty(row.PriorityCode)) camposNulos.push('PriorityCode');
                if (isNullOrEmpty(row.TypeCode)) camposNulos.push('TypeCode');

                if (camposNulos.length > 0) {
                    errorResults.push({
                        ServiceKey: serviceKey || null,
                        Speciality: row.Speciality || null,
                        PriorityCode: row.PriorityCode || null,
                        PriorityDescription: row.PriorityDescription || null,
                        TypeCode: row.TypeCode || null,
                        TypeDescription: row.TypeDescription || null,
                        motivo_erro: `Campos com dados em falta: ${camposNulos.join(', ')}`,
                        campos_nulos: camposNulos
                    });
                } else {
                    validResults.push({
                        ServiceKey: serviceKey,
                        Speciality: row.Speciality,
                        PriorityCode: row.PriorityCode,
                        PriorityDescription: row.PriorityDescription || null,
                        TypeCode: row.TypeCode,
                        TypeDescription: row.TypeDescription || null
                    });
                }
            })
            .on('end', async () => {
                try {
                    if (validResults.length > 0) {
                        await Servico.insertMany(validResults);
                        console.log(`    ✓ ${validResults.length} serviços válidos → BD HealthTime`);
                    }
                    if (errorResults.length > 0) {
                        await ErrorServico.insertMany(errorResults);
                        console.log(`    ⚠ ${errorResults.length} serviços com erros → BD Erros\n`);
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
        const validResults = [];
        const errorResults = [];
        const fullPath = path.join(__dirname, '../../../../', process.env.PATH_CSV_ESPERA_URGENCIA);
        
        console.log(`>>> [3/4] A carregar Urgências de: ${fullPath}`);

        fs.createReadStream(fullPath)
            .pipe(csv())
            .on('data', (row) => {
                const camposNulos = [];
                const lastUpdateDate = new Date(row.LastUpdate);
                const extractionDate = new Date(row.extractionDate);
                
                if (isNaN(lastUpdateDate.getTime())) camposNulos.push('LastUpdate');
                if (isNaN(extractionDate.getTime())) camposNulos.push('extractionDate');
                if (isNullOrEmpty(row.institutionId)) camposNulos.push('institutionId');
                if (isNullOrEmpty(row['EmergencyType.Code'])) camposNulos.push('EmergencyType.Code');

                if (camposNulos.length > 0) {
                    errorResults.push({
                        LastUpdate: isNaN(lastUpdateDate.getTime()) ? null : lastUpdateDate,
                        extractionDate: isNaN(extractionDate.getTime()) ? null : extractionDate,
                        institutionId: row.institutionId || null,
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
                        },
                        motivo_erro: `Campos com dados em falta: ${camposNulos.join(', ')}`,
                        campos_nulos: camposNulos
                    });
                } else {
                    validResults.push({
                        LastUpdate: lastUpdateDate,
                        extractionDate: extractionDate,
                        institutionId: row.institutionId,
                        EmergencyType: {
                            Code: row['EmergencyType.Code'],
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
                }
            })
            .on('end', async () => {
                try {
                    if (validResults.length > 0) {
                        await TemposEsperaEmergencia.insertMany(validResults);
                        console.log(`    ✓ ${validResults.length} urgências válidas → BD HealthTime`);
                    }
                    if (errorResults.length > 0) {
                        await ErrorTemposEsperaEmergencia.insertMany(errorResults);
                        console.log(`    ⚠ ${errorResults.length} urgências com erros → BD Erros\n`);
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
        const validResults = [];
        const errorResults = [];
        const fullPath = path.join(__dirname, '../../../../', process.env.PATH_CSV_ESPERA_CONSULTA);
        
        console.log(`>>> [4/4] A carregar Consultas/Cirurgias de: ${fullPath}`);

        const fileContent = stripBOM(fs.readFileSync(fullPath, 'utf8'));
        const { Readable } = require('stream');
        const stream = Readable.from([fileContent]);

        stream
            .pipe(csv())
            .on('data', (row) => {
                const camposNulos = [];
                const serviceKey = parseInt(row.ServiceKey);
                const year = parseInt(row.Year);
                
                if (isNullOrEmpty(row.HospitalName)) camposNulos.push('HospitalName');
                if (isNaN(serviceKey)) camposNulos.push('ServiceKey');
                if (isNullOrEmpty(row.MonthPortuguese)) camposNulos.push('MonthPortuguese');
                if (!year || isNaN(year)) camposNulos.push('Year');

                if (camposNulos.length > 0) {
                    errorResults.push({
                        HospitalName: row.HospitalName || null,
                        ServiceKey: serviceKey || null,
                        AverageWaitingTime_Speciality_Priority_Institution: parseFloat(row.AverageWaitingTime_Speciality_Priority_Institution) || null,
                        MonthPortuguese: row.MonthPortuguese || null,
                        Year: year || null,
                        NumberOfPeople: parseInt(row.NumberOfPeople) || 0,
                        motivo_erro: `Campos com dados em falta: ${camposNulos.join(', ')}`,
                        campos_nulos: camposNulos
                    });
                } else {
                    validResults.push({
                        HospitalName: row.HospitalName,
                        ServiceKey: serviceKey,
                        AverageWaitingTime_Speciality_Priority_Institution: parseFloat(row.AverageWaitingTime_Speciality_Priority_Institution) || null,
                        MonthPortuguese: row.MonthPortuguese,
                        Year: year,
                        NumberOfPeople: parseInt(row.NumberOfPeople) || 0
                    });
                }
            })
            .on('end', async () => {
                try {
                    if (validResults.length > 0) {
                        await TemposEsperaConsultaCirurgia.insertMany(validResults);
                        console.log(`    ✓ ${validResults.length} consultas/cirurgias válidas → BD HealthTime`);
                    }
                    if (errorResults.length > 0) {
                        await ErrorTemposEsperaConsultaCirurgia.insertMany(errorResults);
                        console.log(`    ⚠ ${errorResults.length} consultas/cirurgias com erros → BD Erros\n`);
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