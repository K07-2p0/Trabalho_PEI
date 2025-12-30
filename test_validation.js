const { validateXML } = require('./src/core/mongo/services/xml_validator');
const fs = require('fs');

async function testar() {
    try {
        // Teste 1: XML de urgência válido
        console.log('\n=== Teste 1: XML Urgência Válido ===');
        const xmlUrgencia = fs.readFileSync('./exemplos_xml/urgencia_exemplo.xml', 'utf-8');
        await validateXML(xmlUrgencia, 'urgencia.xsd');
        console.log('Sucesso: XML Urgência válido');
        
        // Teste 2: XML de consulta válido
        console.log('\n=== Teste 2: XML Consulta Válido ===');
        const xmlConsulta = fs.readFileSync('./exemplos_xml/consulta_exemplo.xml', 'utf-8');
        await validateXML(xmlConsulta, 'consulta.xsd');
        console.log('Sucesso: XML Consulta válido');
        
        // Teste 3: XML de cirurgia válido
        console.log('\n=== Teste 3: XML Cirurgia Válido ===');
        const xmlCirurgia = fs.readFileSync('./exemplos_xml/cirurgia_exemplo.xml', 'utf-8');
        await validateXML(xmlCirurgia, 'cirurgia.xsd');
        console.log('Sucesso: XML Cirurgia válido');
        
        // Teste 4: XML inválido (sem HospitalID)
        console.log('\n=== Teste 4: XML Inválido (sem HospitalID) ===');
        const xmlInvalido = `
            <ReportUrgencia>
                <Cabecalho>
                    <DataHora>2025-12-30T12:00:00</DataHora>
                </Cabecalho>
            </ReportUrgencia>
        `;
        await validateXML(xmlInvalido, 'urgencia.xsd');
        console.log('Sucesso: XML Inválido (não devia chegar aqui)');
        
    } catch (error) {
        console.log('Erro esperado:', error.message);
    }
}

testar();
