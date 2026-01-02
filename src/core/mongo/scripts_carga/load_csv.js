const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const connectDB = require('../db/connection');

require('dotenv').config({ path: path.join(__dirname, '../../../../.env') });

/**
 * Função auxiliar para importar modelos dinamicamente do .env
 */
const getModelFromEnv = (modelFileName) => {
    const relativeModelPath = process.env.PATH_MODELS;
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
 * Função auxiliar para converter valores vazios em null
 */
const parseOrNull = (value, type = 'string') => {
    if (!value || value.trim() === '') return null;
    
    switch(type) {
        case 'number':
            const num = parseFloat(value);
            return isNaN(num) ? null : num;
        case 'int':
            const int = parseInt(value);
            return isNaN(int) ? null : int;
        case 'date':
            const date = new Date(value);
            return isNaN(date.getTime()) ? null : date;
        default:
            return value.trim();
    }
};

/**
 * Função principal de carga
 */
const runLoader = async () => {
    await connectDB();
    console.log('>>> Conexão com MongoDB estabelecida.\n');
    
    // Importar modelos
    const HospitalModel = getModelFromEnv('Hospital');
    const ServicoModel = getModelFromEnv('Servico');
    const TempoEsperaEmergenciaModel = getModelFromEnv('TemposEsperaEmergencia');
    const TempoEsperaConsultaCirurgiaModel = getModelFromEnv('TemposEsperaConsultaCirurgia');

    // =================================================================
    // 1. CARGA DE HOSPITAIS
    // =================================================================
    const loadHospitais = () => {
        return new Promise((resolve) => {
            const results = [];
            const fullPath = path.join(__dirname, '../../../../', process.env.PATH_CSV_HOSPITAIS);
            
            console.log(`>>> [1/4] A carregar Hospitais de: ${fullPath}`);

            fs.createReadStream(fullPath)
                .pipe(csv({ 
                    separator: ';',
                    headers: ['HospitalKey', 'HospitalID', 'HospitalName', 'Description', 'Address', 
                              'District', 'Latitude', 'Longitude', 'NUTSIDescription', 
                              'NUTSIIDescription', 'NUTSIIIDescription', 'PhoneNum', 'Email']
                }))
                .on('data', (row) => {
                    // Ignora cabeçalho se existir
                    if (row.HospitalKey === 'HospitalKey' || !row.HospitalID) return;

                    // Valida se tem pelo menos HospitalID (campo essencial)
                    const hospitalID = parseOrNull(row.HospitalID);
                    if (!hospitalID) return; // Linha inválida

                    results.push({
                        HospitalKey: parseOrNull(row.HospitalKey, 'int'),
                        HospitalID: hospitalID,
                        HospitalName: parseOrNull(row.HospitalName),
                        Description: parseOrNull(row.Description),
                        Address: parseOrNull(row.Address),
                        District: parseOrNull(row.District),
                        Latitude: parseOrNull(row.Latitude, 'number'),
                        Longitude: parseOrNull(row.Longitude, 'number'),
                        NUTSIDescription: parseOrNull(row.NUTSIDescription),
                        NUTSIIDescription: parseOrNull(row.NUTSIIDescription),
                        NUTSIIIDescription: parseOrNull(row.NUTSIIIDescription),
                        PhoneNum: parseOrNull(row.PhoneNum),
                        Email: parseOrNull(row.Email)
                    });
                })
                .on('end', async () => {
                    try {
                        if (results.length > 0) {
                            await HospitalModel.deleteMany({});
                            await HospitalModel.insertMany(results);
                            console.log(`    ✓ ${results.length} hospitais inseridos.\n`);
                        } else {
                            console.log("    ⚠ Nenhum hospital válido encontrado.\n");
                        }
                        resolve();
                    } catch (err) {
                        console.error("    ✗ ERRO ao inserir hospitais:", err.message, '\n');
                        resolve();
                    }
                });
        });
    };

    // =================================================================
    // 2. CARGA DE SERVIÇOS
    // =================================================================
    const loadServicos = () => {
        return new Promise((resolve) => {
            const results = [];
            const fullPath = path.join(__dirname, '../../../../', process.env.PATH_CSV_SERVICOS);
            
            console.log(`>>> [2/4] A carregar Serviços de: ${fullPath}`);

            fs.createReadStream(fullPath)
                .pipe(csv({ 
                    separator: ',', 
                    headers: ['ServiceKey', 'Speciality', 'PriorityCode', 'PriorityDescription', 
                              'TypeCode', 'TypeDescription']
                }))
                .on('data', (row) => {
                    // Ignora cabeçalho
                    if (row.ServiceKey === 'ServiceKey' || !row.ServiceKey) return;

                    const serviceKey = parseOrNull(row.ServiceKey, 'int');
                    const speciality = parseOrNull(row.Speciality);

                    // Valida campos essenciais
                    if (!serviceKey || !speciality) return;

                    results.push({
                        ServiceKey: serviceKey,
                        Speciality: speciality,
                        PriorityCode: parseOrNull(row.PriorityCode),
                        PriorityDescription: parseOrNull(row.PriorityDescription),
                        TypeCode: parseOrNull(row.TypeCode),
                        TypeDescription: parseOrNull(row.TypeDescription)
                    });
                })
                .on('end', async () => {
                    try {
                        if (results.length > 0) {
                            await ServicoModel.deleteMany({});
                            await ServicoModel.insertMany(results);
                            console.log(`    ✓ ${results.length} serviços inseridos.\n`);
                        } else {
                            console.log("    ⚠ Nenhum serviço válido encontrado.\n");
                        }
                        resolve();
                    } catch (err) {
                        console.error("    ✗ ERRO ao inserir serviços:", err.message, '\n');
                        resolve();
                    }
                });
        });
    };

    // =================================================================
    // 3. CARGA DE URGÊNCIAS (TemposEsperaEmergencia)
    // =================================================================
    const loadUrgencias = () => {
        return new Promise((resolve) => {
            const fullPath = path.join(__dirname, '../../../../', process.env.PATH_CSV_ESPERA_URGENCIA);
            
            console.log(`>>> [3/4] A carregar Urgências de: ${fullPath}`);

            // Mapa para agrupar por institutionId + data
            const registosAgrupados = new Map();

            fs.createReadStream(fullPath)
                .pipe(csv({ 
                    separator: ',',
                    headers: false // Lê por índice
                }))
                .on('data', (row) => {
                    // row[0] = Data/Hora
                    // row[2] = InstitutionID
                    // row[4] = EmergencyType Code
                    // row[6], row[7] = Verde (Tempo, Utentes)
                    // row[8], row[9] = Amarelo (Tempo, Utentes)
                    // row[10], row[11] = Laranja (Tempo, Utentes)
                    // row[12], row[13] = Vermelho (Tempo, Utentes)

                    const dataObj = parseOrNull(row[0], 'date');
                    const institutionId = parseOrNull(row[2]);

                    // Ignora linhas sem data ou ID de instituição válidos
                    if (!dataObj || !institutionId) return;

                    const emergencyCode = parseOrNull(row[4]) || 'Geral';
                    const chave = `${institutionId}_${dataObj.toISOString()}`;

                    // Se ainda não existe este registo, cria
                    if (!registosAgrupados.has(chave)) {
                        registosAgrupados.set(chave, {
                            LastUpdate: dataObj,
                            extractionDate: new Date(),
                            institutionId: institutionId,
                            EmergencyType: {
                                Code: emergencyCode,
                                Description: 'Urgência'
                            },
                            Triage: {
                                Red: { Time: null, Length: null },
                                Orange: { Time: null, Length: null },
                                Yellow: { Time: null, Length: null },
                                Green: { Time: null, Length: null },
                                Blue: { Time: null, Length: null }
                            }
                        });
                    }

                    const registo = registosAgrupados.get(chave);

                    // Mapear triagem (ajusta índices conforme o teu CSV)
                    registo.Triage.Green.Time = parseOrNull(row[6], 'int');
                    registo.Triage.Green.Length = parseOrNull(row[7], 'int');
                    
                    registo.Triage.Yellow.Time = parseOrNull(row[8], 'int');
                    registo.Triage.Yellow.Length = parseOrNull(row[9], 'int');
                    
                    registo.Triage.Orange.Time = parseOrNull(row[10], 'int');
                    registo.Triage.Orange.Length = parseOrNull(row[11], 'int');
                    
                    registo.Triage.Red.Time = parseOrNull(row[12], 'int');
                    registo.Triage.Red.Length = parseOrNull(row[13], 'int');
                })
                .on('end', async () => {
                    try {
                        const resultados = Array.from(registosAgrupados.values());
                        
                        if (resultados.length > 0) {
                            await TempoEsperaEmergenciaModel.deleteMany({});
                            await TempoEsperaEmergenciaModel.insertMany(resultados);
                            console.log(`    ✓ ${resultados.length} registos de urgência inseridos.\n`);
                        } else {
                            console.log("    ⚠ Nenhuma urgência válida encontrada.\n");
                        }
                        resolve();
                    } catch (err) {
                        console.error("    ✗ ERRO ao inserir urgências:", err.message, '\n');
                        resolve();
                    }
                });
        });
    };

    // =================================================================
    // 4. CARGA DE CONSULTAS/CIRURGIAS (TemposEsperaConsultaCirurgia)
    // =================================================================
    const loadConsultasCirurgias = () => {
        return new Promise((resolve) => {
            const results = [];
            const fullPath = path.join(__dirname, '../../../../', process.env.PATH_CSV_ESPERA_CONSULTA);
            
            console.log(`>>> [4/4] A carregar Consultas/Cirurgias de: ${fullPath}`);

            const mesesPortugues = [
                'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
            ];

            fs.createReadStream(fullPath)
                .pipe(csv({ 
                    separator: ',', 
                    headers: false 
                })) 
                .on('data', (row) => {
                    // row[0] = HospitalName
                    // row[1] = ServiceKey
                    // row[2] = AverageWaitingTime
                    // row[3] = Month (número ou nome)
                    // row[4] = Year
                    // row[5] = NumberOfPeople

                    // Ignora cabeçalho
                    if (!row[0] || row[0] === 'HospitalName' || row[0] === 'Nome Instituição') return;

                    const hospitalName = parseOrNull(row[0]);
                    const serviceKey = parseOrNull(row[1], 'int');
                    const avgWaitTime = parseOrNull(row[2], 'number');
                    
                    // Ignora linhas onde todos os campos principais estão vazios
                    if (!hospitalName && !serviceKey && !avgWaitTime) return;

                    // Processar mês
                    const mesNum = parseOrNull(row[3], 'int');
                    let mesNome = null;
                    
                    if (mesNum && mesNum >= 1 && mesNum <= 12) {
                        mesNome = mesesPortugues[mesNum - 1];
                    } else if (row[3]) {
                        mesNome = parseOrNull(row[3]);
                    }

                    const year = parseOrNull(row[4], 'int');
                    const numberOfPeople = parseOrNull(row[5], 'int') || 0;

                    results.push({
                        HospitalName: hospitalName,
                        ServiceKey: serviceKey,
                        AverageWaitingTime_Speciality_Priority_Institution: avgWaitTime,
                        MonthPortuguese: mesNome,
                        Year: year,
                        NumberOfPeople: numberOfPeople
                    });
                })
                .on('end', async () => {
                    try {
                        if (results.length > 0) {
                            await TempoEsperaConsultaCirurgiaModel.deleteMany({});
                            await TempoEsperaConsultaCirurgiaModel.insertMany(results);
                            console.log(`    ${results.length} registos de consultas/cirurgias inseridos.\n`);
                        } else {
                            console.log("    Nenhuma consulta/cirurgia válida encontrada.\n");
                        }
                        resolve();
                    } catch (err) {
                        console.error("    ERRO ao inserir consultas/cirurgias:", err.message, '\n');
                        resolve();
                    }
                });
        });
    };

    // =================================================================
    // EXECUÇÃO SEQUENCIAL
    // =================================================================
    await loadHospitais();
    await loadServicos();
    await loadUrgencias();
    await loadConsultasCirurgias(); 
    console.log('>>> Carga concluída. A encerrar conexão com MongoDB.');
    mongoose.connection.close();
}