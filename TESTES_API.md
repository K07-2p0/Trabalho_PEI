# Guia de Testes da API HealthTime

## 🧪 Testes de Submissão XML

### 1. Testar Submissão de Urgência

```bash
curl -X POST http://localhost:3000/submissao/urgencia \
  -H "Content-Type: application/xml" \
  --data '<?xml version="1.0" encoding="UTF-8"?>
<Urgencia>
    <Cabecalho>
        <HospitalID>H001</HospitalID>
        <HospitalNome>Hospital São João</HospitalNome>
        <Morada>Alameda Prof. Hernâni Monteiro, 4200-319 Porto</Morada>
        <Timestamp>2025-12-30T10:15:00</Timestamp>
    </Cabecalho>
    <Dados>
        <TipologiaUrgencia>Geral</TipologiaUrgencia>
        <EstadoUrgencia>Aberta</EstadoUrgencia>
        <UtentesEmEspera>
            <NaoUrgente>5</NaoUrgente>
            <PoucoUrgente>12</PoucoUrgente>
            <Urgente>8</Urgente>
            <MuitoUrgente>3</MuitoUrgente>
            <Emergente>1</Emergente>
        </UtentesEmEspera>
        <UtentesEmObservacao>
            <NaoUrgente>2</NaoUrgente>
            <PoucoUrgente>7</PoucoUrgente>
            <Urgente>15</Urgente>
            <MuitoUrgente>4</MuitoUrgente>
            <Emergente>0</Emergente>
        </UtentesEmObservacao>
        <TempoMedioEspera>45</TempoMedioEspera>
    </Dados>
</Urgencia>'
```

**Ou usando ficheiro:**
```bash
curl -X POST http://localhost:3000/submissao/urgencia \
  -H "Content-Type: application/xml" \
  -d @exemplos_xml/urgencia_exemplo.xml
```

**Resposta esperada:**
```json
{
  "mensagem": "Dados de Urgência integrados com sucesso!",
  "id": "67a1b2c3d4e5f6789abcdef0"
}
```

### 2. Testar Submissão de Consulta

```bash
curl -X POST http://localhost:3000/submissao/consulta \
  -H "Content-Type: application/xml" \
  -d @exemplos_xml/consulta_exemplo.xml
```

### 3. Testar Submissão de Cirurgia

```bash
curl -X POST http://localhost:3000/submissao/cirurgia \
  -H "Content-Type: application/xml" \
  -d @exemplos_xml/cirurgia_exemplo.xml
```

---

## 📊 Testes de Consultas (Relatórios JSON)

### 1. Média de Utentes em Espera

```bash
curl "http://localhost:3000/relatorios/media-espera-urgencia?dataInicio=2025-01-01&dataFim=2025-12-31"
```

**Resposta esperada:**
```json
[
  {
    "tipologia": "Geral",
    "triagem": "Urgente",
    "media_utentes": 8.45
  },
  {
    "tipologia": "Pediátrica",
    "triagem": "Muito Urgente",
    "media_utentes": 3.12
  }
]
```

### 2. Percentagem por Categoria de Triagem

```bash
curl "http://localhost:3000/relatorios/percentagem-triagem-hospital?hospitalId=H001&dataInicio=2025-12-01&dataFim=2025-12-31&periodo=dia"
```

### 3. Pediatria por Região

```bash
curl "http://localhost:3000/relatorios/pediatria-regiao?dataInicio=2025-12-01&dataFim=2025-12-31"
```

**Resposta esperada:**
```json
[
  {
    "regiao": "Norte",
    "tempo_medio_minutos": 32.5,
    "total_atendimentos": 1250
  },
  {
    "regiao": "Centro",
    "tempo_medio_minutos": 38.2,
    "total_atendimentos": 890
  }
]
```

### 4. Top 10 Hospitais (Pediatria)

```bash
curl "http://localhost:3000/relatorios/top-hospitais-pediatria?dataInicio=2025-01-01&dataFim=2025-12-31"
```

**Resposta esperada:**
```json
[
  {
    "hospital_nome": "Hospital São João",
    "regiao": "Norte",
    "contacto": "225512100",
    "tempo_medio_espera": 28.5
  },
  {
    "hospital_nome": "Hospital de Santa Maria",
    "regiao": "Lisboa e Vale do Tejo",
    "contacto": "217805000",
    "tempo_medio_espera": 31.2
  }
]
```

### 5. Diferença Oncologia vs Não-Oncologia

```bash
curl "http://localhost:3000/relatorios/diferenca-oncologia?especialidade=Cardiologia&dataInicio=2025-01-01&dataFim=2025-12-31"
```

### 6. Tempo Médio de Cirurgia

```bash
curl "http://localhost:3000/relatorios/tempo-cirurgia?mes=12&ano=2025"
```

**Resposta esperada:**
```json
[
  {
    "especialidade": "Cirurgia Geral",
    "media_lista_geral": 90.5,
    "media_lista_oncologica": 60.2
  },
  {
    "especialidade": "Ortopedia",
    "media_lista_geral": 120.8,
    "media_lista_oncologica": 75.3
  }
]
```

### 7. Evolução Temporal (Picos de Afluência)

```bash
curl "http://localhost:3000/relatorios/evolucao-temporal?data=2025-12-30"
```

**Resposta esperada:**
```json
{
  "timeline": [
    {
      "intervalo": "08:00",
      "media_espera": 25.5,
      "afluencia": 15
    },
    {
      "intervalo": "08:15",
      "media_espera": 28.3,
      "afluencia": 18
    }
  ],
  "top_picos": [
    {
      "intervalo": "10:30",
      "media_espera": 45.2,
      "afluencia": 35
    },
    {
      "intervalo": "18:00",
      "media_espera": 52.1,
      "afluencia": 32
    },
    {
      "intervalo": "20:45",
      "media_espera": 48.7,
      "afluencia": 28
    }
  ]
}
```

### 8. Discrepância Consulta vs Cirurgia

```bash
curl "http://localhost:3000/relatorios/discrepancia-tempos?granularidade=mes&dataInicio=2025-01-01&dataFim=2025-12-31"
```

---

## 🛠️ Testes com Postman

### Importar Coleção

1. Abrir Postman
2. Importar > Raw text
3. Colar os exemplos acima adaptados para formato Postman

### Variáveis de Ambiente

Criar variáveis:
- `base_url`: `http://localhost:3000`
- `hospital_id`: `H001`
- `data_inicio`: `2025-01-01`
- `data_fim`: `2025-12-31`

---

## ⚠️ Tratamento de Erros

### XML Inválido

**Request:**
```bash
curl -X POST http://localhost:3000/submissao/urgencia \
  -H "Content-Type: application/xml" \
  --data '<Urgencia><Dados></Urgencia>'
```

**Resposta:**
```json
{
  "erro": "XML Inválido: Missing closing tag for Dados"
}
```

### Parâmetros em Falta

**Request:**
```bash
curl "http://localhost:3000/relatorios/pediatria-regiao"
```

**Resposta:**
```json
{
  "erro": "Parâmetros dataInicio e dataFim são obrigatórios"
}
```

---

## 📝 Verificar Estado do Sistema

### Health Check (adicionar ao server.js)

```bash
curl http://localhost:3000/health
```

**Resposta:**
```json
{
  "status": "OK",
  "mongodb": "connected",
  "timestamp": "2025-12-30T10:15:00Z"
}
```

---

## 🐞 Debug

### Verificar Logs do Servidor

Ao executar o servidor, deve ver:
```
>>> Servidor API REST a correr na porta 3000
>>> MongoDB conectado com sucesso
>>> XML Validado (Estrutura básica OK)
```

### Verificar dados no MongoDB

```bash
# Entrar no MongoDB shell
mongo healthtime

# Listar coleções
show collections

# Ver documentos
db.urgencias.find().limit(5).pretty()
db.hospitais.find().limit(5).pretty()
```