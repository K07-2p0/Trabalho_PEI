# Changelog - Validação XSD e Tratamento de Erros

## Novas Funcionalidades Implementadas

### 1. Validação XSD Sem C++

**Ficheiro**: `src/core/mongo/services/xml_validator.js`

- Validação estrutural do XML usando `fast-xml-parser`
- Validação de regras de negócio customizadas para:
  - **Urgência**: Tipologia, Estado, Triagem, Número de utentes
  - **Consulta**: Especialidades, População alvo, Tempos de resposta
  - **Cirurgia**: Especialidades, Listas de espera, Tempos de espera
- Deteção automática do tipo de documento XML
- Não requer compilação de bibliotecas C++

### 2. Pipeline de Transformação Melhorado

**Ficheiro**: `src/core/mongo/services/data_transformer.js`

- Transformação robusta com validações de dados obrigatórios
- Tratamento de arrays e valores únicos
- Parsing automático de números
- Conversão de períodos (YYYY-MM) para mês/ano
- Metadados de integração (dataIntegracao, fonteOriginal)

### 3. Tratamento de Erros

**Novo Modelo**: `src/core/consultas_agregacao/models/ErroIntegracao.js`

**Campos**:
- `tipo`: Tipo de erro (urgencia, consulta, cirurgia, validacao, transformacao, persistencia)
- `mensagemErro`: Descrição do erro
- `xmlOriginal`: XML que causou o erro (opcional)
- `detalhesErro`: Detalhes adicionais (stack trace, etc.)
- `dataOcorrencia`: Timestamp do erro
- `resolvido`: Flag indicando se foi resolvido
- `dataResolucao`: Data de resolução
- `observacoes`: Notas sobre a resolução

### 4. Novos Endpoints

#### Submissão com Validação

**POST /submissao/urgencia**
- Valida XML contra regras de urgência
- Transforma e persiste no MongoDB
- Regista erros automaticamente

**POST /submissao/consulta**
- Valida XML contra regras de consulta
- Transforma e persiste no MongoDB

**POST /submissao/cirurgia**
- Valida XML contra regras de cirurgia
- Transforma e persiste no MongoDB

**POST /submissao/auto**
- Detecta automaticamente o tipo de XML
- Valida, transforma e persiste

#### Gestão de Erros

**GET /submissao/erros**
- Lista erros de integração
- Parâmetros:
  - `resolvido`: true/false (default: false)
  - `tipo`: urgencia/consulta/cirurgia
  - `limite`: número máximo de resultados (default: 50)

**GET /submissao/erros/:id**
- Obtém detalhes de um erro específico
- Inclui XML original

**PATCH /submissao/erros/:id/resolver**
- Marca erro como resolvido
- Corpo: `{ "observacoes": "Foi corrigido..." }`

#### Relatórios

**GET /relatorios/estatisticas-erros**
- Estatísticas agregadas de erros
- Total de erros por tipo
- Erros resolvidos vs não resolvidos

## Instalação

Nenhuma instalação adicional necessária! Todas as dependências já existem no projeto:
- `fast-xml-parser`: Já instalado
- `xml2js`: Já instalado
- `mongoose`: Já instalado

## Testes

### 1. Testar Submissão Válida

```bash
curl -X POST http://localhost:3000/submissao/urgencia \
  -H "Content-Type: application/xml" \
  -d @exemplos_xml/urgencia_exemplo.xml
```

**Resposta esperada**:
```json
{
  "sucesso": true,
  "mensagem": "Dados de Urgência integrados com sucesso!",
  "id": "67...",
  "hospitalId": "H001",
  "dataRegisto": "2025-12-30T12:00:00.000Z"
}
```

### 2. Testar XML Inválido (sem HospitalID)

```bash
curl -X POST http://localhost:3000/submissao/urgencia \
  -H "Content-Type: application/xml" \
  -d '<ReportUrgencia><Cabecalho><DataHora>2025-12-30T12:00:00</DataHora></Cabecalho></ReportUrgencia>'
```

**Resposta esperada**:
```json
{
  "sucesso": false,
  "erro": "XML inválido: HospitalID obrigatório no Cabecalho",
  "tipo": "validacao"
}
```

### 3. Testar Submissão Automática

```bash
curl -X POST http://localhost:3000/submissao/auto \
  -H "Content-Type: application/xml" \
  -d @exemplos_xml/consulta_exemplo.xml
```

**Resposta esperada**:
```json
{
  "sucesso": true,
  "mensagem": "Dados de consulta integrados com sucesso!",
  "tipo": "consulta",
  "id": "67..."
}
```

### 4. Listar Erros

```bash
# Listar todos os erros não resolvidos
curl http://localhost:3000/submissao/erros

# Listar erros de urgência
curl "http://localhost:3000/submissao/erros?tipo=urgencia"

# Listar erros resolvidos
curl "http://localhost:3000/submissao/erros?resolvido=true"
```

### 5. Ver Detalhes de um Erro

```bash
curl http://localhost:3000/submissao/erros/67abc123def456789
```

### 6. Marcar Erro como Resolvido

```bash
curl -X PATCH http://localhost:3000/submissao/erros/67abc123def456789/resolver \
  -H "Content-Type: application/json" \
  -d '{"observacoes": "XML corrigido e reenviado com sucesso"}'
```

### 7. Estatísticas de Erros

```bash
curl http://localhost:3000/relatorios/estatisticas-erros
```

**Resposta esperada**:
```json
{
  "sucesso": true,
  "totalErros": 15,
  "errosNaoResolvidos": 8,
  "porTipo": [
    {
      "_id": "urgencia",
      "total": 10,
      "naoResolvidos": 5,
      "resolvidos": 5
    },
    {
      "_id": "consulta",
      "total": 5,
      "naoResolvidos": 3,
      "resolvidos": 2
    }
  ]
}
```

## Regras de Validação Implementadas

### Urgência
- HospitalID obrigatório e não vazio
- DataHora obrigatória no formato ISO 8601
- Tipologia: 'Geral', 'Pediátrica', 'Obstétrica', 'Médico-Cirúrgica', 'Polivalente'
- EstadoServico: 'Aberta' ou 'Fechada'
- Morada obrigatória
- CorTriagem: 'Emergente', 'Muito Urgente', 'Urgente', 'Pouco Urgente', 'Não Urgente'
- NumeroUtentes deve ser número >= 0
- TempoEspera deve ser número >= 0

### Consulta
- HospitalID obrigatório
- Periodo obrigatório no formato YYYY-MM
- Nome de especialidade obrigatório
- PopulacaoAlvo: 'Adulto', 'Criança', 'Ambos'
- TipoLista: 'Geral', 'Não-Oncológica', 'Oncológica'
- TempoMuitoPrioritario, TempoPrioritario, TempoNormal obrigatórios (>= 0 dias)

### Cirurgia
- HospitalID obrigatório
- Periodo obrigatório no formato YYYY-MM
- Nome de especialidade obrigatório
- TipoLista: 'Geral', 'Não-Oncológica', 'Oncológica'
- TempoEspera obrigatório (>= 0 dias)
- NumeroCirurgias deve ser número >= 0

## Beneficios

1. **Sem Dependências C++**: Funciona em qualquer ambiente Node.js
2. **Validação Robusta**: Validação de estrutura + regras de negócio
3. **Rastreabilidade**: Todos os erros ficam registados para análise
4. **Gestão de Erros**: Sistema completo de gestão e resolução de erros
5. **API Inteligente**: Endpoint auto que detecta tipo de XML automaticamente
6. **Estatísticas**: Visão geral dos erros de integração

## Próximos Passos

- Dashboard MongoDB Atlas para visualização de erros
- Notificações automáticas de erros críticos
- Exportação de relatórios de erros em CSV/PDF
- Retry automático de XMLs com erros corrigíveis