const express = require('express');
const router = express.Router();
const { validarXML } = require('../../mongo/services/xml_validator');
const { transformUrgencia, transformConsulta, transformCirurgia } = require('../../mongo/services/data_transformer');
const TempoEsperaEmergencia = require('../../consultas_agregacao/models/TemposEsperaEmergencia');
const TempoEsperaConsultaCirurgia = require('../../consultas_agregacao/models/TemposEsperaConsultaCirurgia');
const Hospital = require('../../consultas_agregacao/models/Hospital');
const Servico = require('../../consultas_agregacao/models/Servicos');

/**
 * Função auxiliar para buscar ou criar ServiceKey
 * Baseado na combinação de especialidade + prioridade + tipo
 */
async function getOrCreateServiceKey(metadata) {
    const { especialidade, prioridade, tipoLista, populacaoAlvo } = metadata;
    
    // Criar código único baseado nos campos
    const priorityCode = prioridade || 'Normal';
    const typeCode = tipoLista || 'Geral';
    
    // Procurar se já existe
    let servico = await Servico.findOne({
        Speciality: especialidade,
        PriorityCode: priorityCode,
        TypeCode: typeCode
    });
    
    if (!servico) {
        // Criar novo ServiceKey (usar contador ou gerar ID único)
        const ultimoServico = await Servico.findOne().sort({ ServiceKey: -1 });
        const novoServiceKey = ultimoServico ? ultimoServico.ServiceKey + 1 : 1;
        
        servico = new Servico({
            ServiceKey: novoServiceKey,
            Speciality: especialidade,
            PriorityCode: priorityCode,
            PriorityDescription: prioridade,
            TypeCode: typeCode,
            TypeDescription: tipoLista
        });
        
        await servico.save();
    }
    
    return servico.ServiceKey;
}

/**
 * Função auxiliar para buscar nome do hospital pelo ID
 */
async function getHospitalName(hospitalId) {
    const hospital = await Hospital.findOne({ HospitalID: hospitalId });
    return hospital ? hospital.HospitalName : hospitalId; // Retorna ID se não encontrar nome
}

/**
 * POST /submissao/urgencias
 * Submete dados de urgências (XML)
 */
router.post('/urgencias', async (req, res) => {
    try {
        const xmlData = req.body.xml;
        
        if (!xmlData) {
            return res.status(400).json({ 
                sucesso: false, 
                erro: 'XML não fornecido no corpo da requisição' 
            });
        }

        // Validar XML contra o schema XSD
        const validacao = await validarXML(xmlData, 'urgencia');
        if (!validacao.valido) {
            return res.status(400).json({ 
                sucesso: false, 
                erro: 'XML inválido', 
                detalhes: validacao.erros 
            });
        }

        // Transformar XML em formato TemposEsperaEmergencia
        const dadosTransformados = await transformUrgencia(xmlData);

        // Criar e salvar documento
        const novoRegisto = new TempoEsperaEmergencia(dadosTransformados);
        await novoRegisto.save();

        res.status(201).json({
            sucesso: true,
            mensagem: 'Dados de urgência submetidos com sucesso',
            id: novoRegisto._id,
            dados: {
                institutionId: novoRegisto.institutionId,
                lastUpdate: novoRegisto.LastUpdate,
                emergencyType: novoRegisto.EmergencyType
            }
        });

    } catch (erro) {
        console.error('Erro na submissão de urgências:', erro);
        res.status(500).json({
            sucesso: false,
            erro: 'Erro ao processar dados de urgência',
            detalhes: erro.message
        });
    }
});

/**
 * POST /submissao/consultas
 * Submete dados de consultas (XML)
 */
router.post('/consultas', async (req, res) => {
    try {
        const xmlData = req.body.xml;
        
        if (!xmlData) {
            return res.status(400).json({ 
                sucesso: false, 
                erro: 'XML não fornecido no corpo da requisição' 
            });
        }

        // Validar XML contra o schema XSD
        const validacao = await validarXML(xmlData, 'consulta');
        if (!validacao.valido) {
            return res.status(400).json({ 
                sucesso: false, 
                erro: 'XML inválido', 
                detalhes: validacao.erros 
            });
        }

        // Transformar XML em array de documentos TemposEsperaConsultaCirurgia
        const documentosBase = await transformConsulta(xmlData);
        
        if (documentosBase.length === 0) {
            return res.status(400).json({
                sucesso: false,
                erro: 'Nenhum dado de consulta encontrado no XML'
            });
        }

        // Enriquecer documentos com HospitalName e ServiceKey
        const documentosEnriquecidos = [];
        for (const doc of documentosBase) {
            const hospitalName = await getHospitalName(doc.HospitalName);
            const serviceKey = await getOrCreateServiceKey(doc._metadata);
            
            documentosEnriquecidos.push({
                HospitalName: hospitalName,
                ServiceKey: serviceKey,
                AverageWaitingTime_Speciality_Priority_Institution: doc.AverageWaitingTime_Speciality_Priority_Institution,
                MonthPortuguese: doc.MonthPortuguese,
                Year: doc.Year,
                NumberOfPeople: doc.NumberOfPeople
            });
        }

        // Salvar todos os documentos
        const registosSalvos = await TempoEsperaConsultaCirurgia.insertMany(documentosEnriquecidos);

        res.status(201).json({
            sucesso: true,
            mensagem: `${registosSalvos.length} registos de consultas submetidos com sucesso`,
            quantidade: registosSalvos.length,
            periodo: {
                mes: documentosBase[0].MonthPortuguese,
                ano: documentosBase[0].Year
            }
        });

    } catch (erro) {
        console.error('Erro na submissão de consultas:', erro);
        res.status(500).json({
            sucesso: false,
            erro: 'Erro ao processar dados de consultas',
            detalhes: erro.message
        });
    }
});

/**
 * POST /submissao/cirurgias
 * Submete dados de cirurgias (XML)
 */
router.post('/cirurgias', async (req, res) => {
    try {
        const xmlData = req.body.xml;
        
        if (!xmlData) {
            return res.status(400).json({ 
                sucesso: false, 
                erro: 'XML não fornecido no corpo da requisição' 
            });
        }

        // Validar XML contra o schema XSD
        const validacao = await validarXML(xmlData, 'cirurgia');
        if (!validacao.valido) {
            return res.status(400).json({ 
                sucesso: false, 
                erro: 'XML inválido', 
                detalhes: validacao.erros 
            });
        }

        // Transformar XML em array de documentos TemposEsperaConsultaCirurgia
        const documentosBase = await transformCirurgia(xmlData);
        
        if (documentosBase.length === 0) {
            return res.status(400).json({
                sucesso: false,
                erro: 'Nenhum dado de cirurgia encontrado no XML'
            });
        }

        // Enriquecer documentos com HospitalName e ServiceKey
        const documentosEnriquecidos = [];
        for (const doc of documentosBase) {
            const hospitalName = await getHospitalName(doc.HospitalName);
            const serviceKey = await getOrCreateServiceKey(doc._metadata);
            
            documentosEnriquecidos.push({
                HospitalName: hospitalName,
                ServiceKey: serviceKey,
                AverageWaitingTime_Speciality_Priority_Institution: doc.AverageWaitingTime_Speciality_Priority_Institution,
                MonthPortuguese: doc.MonthPortuguese,
                Year: doc.Year,
                NumberOfPeople: doc.NumberOfPeople
            });
        }

        // Salvar todos os documentos
        const registosSalvos = await TempoEsperaConsultaCirurgia.insertMany(documentosEnriquecidos);

        res.status(201).json({
            sucesso: true,
            mensagem: `${registosSalvos.length} registos de cirurgias submetidos com sucesso`,
            quantidade: registosSalvos.length,
            periodo: {
                mes: documentosBase[0].MonthPortuguese,
                ano: documentosBase[0].Year
            }
        });

    } catch (erro) {
        console.error('Erro na submissão de cirurgias:', erro);
        res.status(500).json({
            sucesso: false,
            erro: 'Erro ao processar dados de cirurgias',
            detalhes: erro.message
        });
    }
});

module.exports = router;
