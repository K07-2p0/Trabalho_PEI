const express = require('express');
const router = express.Router();
const { XMLParser, XMLValidator } = require('fast-xml-parser');

// Importar modelos
const Hospital = require('../../consultas_agregacao/models/Hospital');
const Servico = require('../../consultas_agregacao/models/Servicos');
const TempoEsperaEmergencia = require('../../consultas_agregacao/models/TemposEsperaEmergencia');
const TempoEsperaConsultaCirurgia = require('../../consultas_agregacao/models/TemposEsperaConsultaCirurgia');

const parser = new XMLParser();

/**
 * Validar XML (validação básica)
 */
function validarXML(xmlString) {
    try {
        const result = XMLValidator.validate(xmlString);
        
        if (result !== true) {
            return {
                valido: false,
                erros: [result.err.msg]
            };
        }
        
        return { valido: true, erros: [] };
    } catch (erro) {
        return {
            valido: false,
            erros: [`Erro ao validar XML: ${erro.message}`]
        };
    }
}

/**
 * 1. POST /submissao/hospital - Submeter dados de Hospital
 */
router.post('/hospital', async (req, res) => {
    try {
        const xmlString = req.body;
        
        // Validar XML
        const validacao = validarXML(xmlString);
        if (!validacao.valido) {
            return res.status(400).json({
                erro: 'XML inválido',
                detalhes: validacao.erros
            });
        }
        
        // Parse XML
        const resultado = parser.parse(xmlString);
        const hospital = resultado.Hospital;
        
        // Extrair dados
        const hospitalData = {
            Codigo: parseInt(hospital.Codigo),
            Nome: hospital.Nome,
            Morada: hospital.Morada || null,
            Localidade: hospital.Localidade || null,
            CodigoPostal: hospital.CodigoPostal || null,
            Telefone: hospital.Telefone || null,
            Email: hospital.Email || null,
            Website: hospital.Website || null,
            Regiao: hospital.Regiao || null,
            Latitude: parseFloat(hospital.Latitude) || null,
            Longitude: parseFloat(hospital.Longitude) || null
        };
        
        // Inserir ou atualizar na BD
        const resultadoDB = await Hospital.findOneAndUpdate(
            { Codigo: hospitalData.Codigo },
            hospitalData,
            { upsert: true, new: true, runValidators: true }
        );
        
        res.status(201).json({
            mensagem: 'Hospital submetido com sucesso',
            dados: resultadoDB
        });
        
    } catch (erro) {
        console.error('Erro ao submeter hospital:', erro);
        res.status(500).json({
            erro: 'Erro ao processar submissão',
            detalhes: erro.message
        });
    }
});

/**
 * 2. POST /submissao/servico - Submeter dados de Serviço
 */
router.post('/servico', async (req, res) => {
    try {
        const xmlString = req.body;
        
        // Validar XML
        const validacao = validarXML(xmlString);
        if (!validacao.valido) {
            return res.status(400).json({
                erro: 'XML inválido',
                detalhes: validacao.erros
            });
        }
        
        // Parse XML
        const resultado = parser.parse(xmlString);
        const servico = resultado.Servico;
        
        // Extrair dados
        const servicoData = {
            Code: servico.Code,
            Description: servico.Description,
            Type: servico.Type || null
        };
        
        // Inserir ou atualizar na BD
        const resultadoDB = await Servico.findOneAndUpdate(
            { Code: servicoData.Code },
            servicoData,
            { upsert: true, new: true, runValidators: true }
        );
        
        res.status(201).json({
            mensagem: 'Serviço submetido com sucesso',
            dados: resultadoDB
        });
        
    } catch (erro) {
        console.error('Erro ao submeter serviço:', erro);
        res.status(500).json({
            erro: 'Erro ao processar submissão',
            detalhes: erro.message
        });
    }
});

/**
 * 3. POST /submissao/urgencia - Submeter dados de Urgência
 */
router.post('/urgencia', async (req, res) => {
    try {
        const xmlString = req.body;
        
        // Validar XML
        const validacao = validarXML(xmlString);
        if (!validacao.valido) {
            return res.status(400).json({
                erro: 'XML inválido',
                detalhes: validacao.erros
            });
        }
        
        // Parse XML
        const resultado = parser.parse(xmlString);
        const urgencia = resultado.Urgencia;
        
        // Extrair dados
        const urgenciaData = {
            LastUpdate: new Date(urgencia.LastUpdate),
            extractionDate: new Date(),
            institutionId: urgencia.InstitutionId,
            EmergencyType: {
                Code: urgencia.EmergencyType.Code,
                Description: urgencia.EmergencyType.Description
            },
            Triage: {
                Red: {
                    Time: parseInt(urgencia.Triage.Red.Time) || 0,
                    Length: parseInt(urgencia.Triage.Red.Length) || 0
                },
                Orange: {
                    Time: parseInt(urgencia.Triage.Orange.Time) || 0,
                    Length: parseInt(urgencia.Triage.Orange.Length) || 0
                },
                Yellow: {
                    Time: parseInt(urgencia.Triage.Yellow.Time) || 0,
                    Length: parseInt(urgencia.Triage.Yellow.Length) || 0
                },
                Green: {
                    Time: parseInt(urgencia.Triage.Green.Time) || 0,
                    Length: parseInt(urgencia.Triage.Green.Length) || 0
                },
                Blue: {
                    Time: parseInt(urgencia.Triage.Blue.Time) || 0,
                    Length: parseInt(urgencia.Triage.Blue.Length) || 0
                }
            }
        };
        
        // Inserir na BD
        const resultadoDB = await TempoEsperaEmergencia.create(urgenciaData);
        
        res.status(201).json({
            mensagem: 'Dados de urgência submetidos com sucesso',
            dados: resultadoDB
        });
        
    } catch (erro) {
        console.error('Erro ao submeter urgência:', erro);
        res.status(500).json({
            erro: 'Erro ao processar submissão',
            detalhes: erro.message
        });
    }
});

/**
 * 4. POST /submissao/consulta-cirurgia - Submeter dados de Consulta/Cirurgia
 */
router.post('/consulta-cirurgia', async (req, res) => {
    try {
        const xmlString = req.body;
        
        console.log('=== XML RECEBIDO ===');
        console.log(xmlString);
        console.log('===================');
        
        // Validar XML
        const validacao = validarXML(xmlString);
        if (!validacao.valido) {
            return res.status(400).json({
                erro: 'XML inválido',
                detalhes: validacao.erros
            });
        }
        
        // Parse XML
        const resultado = parser.parse(xmlString);
        
        console.log('=== RESULTADO PARSE ===');
        console.log(JSON.stringify(resultado, null, 2));
        console.log('======================');
        
        const consulta = resultado.ConsultaCirurgia;
        
        if (!consulta) {
            return res.status(400).json({
                erro: 'Estrutura XML inválida',
                detalhes: 'Não foi encontrada a tag <ConsultaCirurgia>',
                estrutura_recebida: resultado
            });
        }
        
        // Extrair dados
        const consultaData = {
            LastUpdate: new Date(consulta.LastUpdate),
            extractionDate: new Date(),
            Year: parseInt(consulta.Year),
            Month: parseInt(consulta.Month),
            InstitutionCode: consulta.InstitutionCode,
            InstitutionName: consulta.InstitutionName,
            Specialty: {
                Code: consulta.Specialty.Code,
                Description: consulta.Specialty.Description
            },
            Type: consulta.Type,
            Patients: {
                Total: parseInt(consulta.Patients.Total) || 0,
                AverageResponseTime: parseFloat(consulta.Patients.AverageResponseTime) || 0
            }
        };
        
        // Inserir na BD
        const resultadoDB = await TempoEsperaConsultaCirurgia.create(consultaData);
        
        res.status(201).json({
            mensagem: 'Dados de consulta/cirurgia submetidos com sucesso',
            dados: resultadoDB
        });
        
    } catch (erro) {
        console.error('Erro ao submeter consulta/cirurgia:', erro);
        res.status(500).json({
            erro: 'Erro ao processar submissão',
            detalhes: erro.message,
            stack: erro.stack
        });
    }
});


module.exports = router;