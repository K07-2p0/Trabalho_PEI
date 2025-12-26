const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const connectDB = require('../db/connection');

require('dotenv').config({ path: path.join(__dirname, '../../../../.env') });

const getModelFromEnv = (modelFileName) => {
    const relativeModelPath = process.env.PATH_MODELS;
    const fullPath = path.join(__dirname, '../../../../', relativeModelPath, modelFileName);
    try {
        return require(fullPath);
    } catch (error) {
        console.error(`>>> ERRO ao importar modelo de: ${fullPath}`);
        process.exit(1);
    }
};

const runLoader = async () => {
    await connectDB();
    
    const HospitalModel = getModelFromEnv('Hospital');
    const ServicoModel = getModelFromEnv('Servico');
    const UrgenciaModel = getModelFromEnv('Urgencia');
    const ConsultaCirurgiaModel = getModelFromEnv('ConsultaCirurgia');

    // --- CARGA DE URGÊNCIAS (Versão Segura) ---
    const loadUrgencias = () => {
        return new Promise((resolve) => {
            const results = [];
            const fullPath = path.join(__dirname, '../../../../', process.env.PATH_CSV_ESPERA_URGENCIA);
            
            console.log(`>>> A carregar Urgências de: ${fullPath}`);

            fs.createReadStream(fullPath)
                .pipe(csv({ 
                    separator: ',', // Conforme a tua amostra
                    headers: false  // Lemos por índice 0, 1, 2...
                }))
                .on('data', (row) => {
                    // Tenta criar a data a partir da primeira coluna (row[0])
                    const dataRaw = row[0];
                    const dataObj = new Date(dataRaw);

                    // SEGURANÇA: Se a data for inválida (ex: cabeçalho ou linha vazia), ignora esta linha
                    if (isNaN(dataObj.getTime())) {
                        return; 
                    }

                    const common = {
                        hospital_id: row[2],
                        data_registo: dataObj,
                        tipologia: row[4],
                        estado: 'Aberta'
                    };

                    // Mapeamento baseado nos índices da tua linha:
                    // row[7] = Não Urgente, row[9] = Pouco Urgente, row[11] = Urgente, row[13] = Muito Urgente
                    
                    if(row[7] !== undefined) results.push({ ...common, triagem: 'Não Urgente', utentes_em_espera: parseInt(row[7]) || 0 });
                    if(row[9] !== undefined) results.push({ ...common, triagem: 'Pouco Urgente', utentes_em_espera: parseInt(row[9]) || 0 });
                    if(row[11] !== undefined) results.push({ ...common, triagem: 'Urgente', utentes_em_espera: parseInt(row[11]) || 0 });
                    if(row[13] !== undefined) results.push({ ...common, triagem: 'Muito Urgente', utentes_em_espera: parseInt(row[13]) || 0 });
                })
                .on('end', async () => {
                    try {
                        if (results.length > 0) {
                            await UrgenciaModel.deleteMany({});
                            await UrgenciaModel.insertMany(results);
                            console.log(`>>> [SUCESSO] Urgencia: ${results.length} registos inseridos.`);
                        } else {
                            console.log(">>> [AVISO] Nenhum dado de urgência válido encontrado.");
                        }
                        resolve();
                    } catch (err) {
                        console.error(">>> [ERRO] Falha ao inserir no Mongo:", err.message);
                        resolve();
                    }
                });
        });
    };

    // --- CARGA DE HOSPITAIS ---
    const loadHospitais = () => {
        return new Promise((resolve) => {
            const results = [];
            fs.createReadStream(path.join(__dirname, '../../../../', process.env.PATH_CSV_HOSPITAIS))
                .pipe(csv({ separator: ';', headers: ['codigo', 'instituicao', 'regiao', 'concelho', 'morada'] }))
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                    await HospitalModel.deleteMany({});
                    await HospitalModel.insertMany(results.slice(1)); // Ignora a 1ª linha se for cabeçalho
                    console.log(`>>> [SUCESSO] Hospitais carregados.`);
                    resolve();
                });
        });
    };

    const loadServicos = () => {
        return new Promise((resolve) => {
            const results = [];
            const fullPath = path.join(__dirname, '../../../../', process.env.PATH_CSV_SERVICOS);
            
            fs.createReadStream(fullPath)
                .pipe(csv({ 
                    separator: ',', 
                    headers: false 
                }))
                .on('data', (row) => {
                    // Tradução de termos baseada na tua linha de exemplo:
                    // row[1] = Psiquiatria...
                    // row[2] = 3 (População)
                    // row[5] = Appointment (Tipo)

                    let tipoTraduzido = row[5] ? row[5].trim() : '';
                    if (tipoTraduzido === 'Appointment') tipoTraduzido = 'Consulta';
                    if (tipoTraduzido === 'Urgency') tipoTraduzido = 'Urgência';
                    if (tipoTraduzido === 'Surgery') tipoTraduzido = 'Cirurgia';

                    let popTraduzida = row[2] ? row[2].trim() : 'Todos';
                    if (popTraduzida === '3') popTraduzida = 'Todos';
                    if (popTraduzida === '1') popTraduzida = 'Adulto';
                    if (popTraduzida === '2') popTraduzida = 'Pediátrico';

                    if (row[1] && row[1] !== 'Speciality') { // Ignora cabeçalho
                        results.push({
                            nome_servico: row[1].trim(),
                            tipo: tipoTraduzido,
                            populacao: popTraduzida
                        });
                    }
                })
                .on('end', async () => {
                    try {
                        await ServicoModel.deleteMany({});
                        if (results.length > 0) {
                            await ServicoModel.insertMany(results);
                            console.log(`>>> [SUCESSO] Servicos: ${results.length} registos inseridos.`);
                        }
                        resolve();
                    } catch (err) {
                        console.error(">>> [ERRO] Servicos:", err.message);
                        resolve();
                    }
                });
        });
    };

    const loadConsultasCirurgias = () => {
        return new Promise((resolve) => {
            const results = [];
            const fullPath = path.join(__dirname, '../../../../', process.env.PATH_CSV_ESPERA_CONSULTA);
            
            fs.createReadStream(fullPath)
                .pipe(csv({ separator: ',', headers: false })) 
                .on('data', (row) => {
                    // Removemos o isNaN porque o teu hospital_id é o NOME (texto)
                    if (!row[0] || row[0] === 'Nome Instituição') return; 

                    results.push({
                        hospital_id: row[0],         // "Centro Materno-Infantil..."
                        tipo: row[1],                // "7"
                        especialidade: row[2],       // "41"
                        prioridade: row[3] || 'Normal',
                        // Na tua linha: row[4] parece ser o ANO (2024) e row[5] o VALOR (21)
                        // Ajusta se a ordem for diferente no ficheiro real
                        tempo_medio_resposta: parseFloat(row[5]) || 0, 
                        lista_espera_total: parseInt(row[5]) || 0 
                    });
                })
                .on('end', async () => {
                    try {
                        await ConsultaCirurgiaModel.deleteMany({});
                        if (results.length > 0) {
                            await ConsultaCirurgiaModel.insertMany(results);
                            console.log(`>>> [SUCESSO] Consultas/Cirurgias: ${results.length} registos.`);
                        }
                        resolve();
                    } catch (err) {
                        console.error(">>> [ERRO] Consultas/Cirurgias:", err.message);
                        resolve();
                    }
                });
        });
    };

    await loadHospitais();
    await loadUrgencias();
    await loadServicos();
    await loadConsultasCirurgias();

    console.log('>>> Processo concluído.');
    process.exit();
};

runLoader();