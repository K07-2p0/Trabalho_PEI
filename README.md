# HealthTime - Sistema de Monitorização de Tempos de Espera Hospitalares

## Descrição do Projeto

O **HealthTime** é um sistema de monitorização uniforme dos tempos de espera hospitalares (urgência, consulta e cirurgia) através da recolha periódica de informação enviada por hospitais parceiros em formato XML. Os dados são armazenados numa base de dados MongoDB e disponibilizados através de uma API REST em formato JSON.

## 🏛️ Arquitetura do Sistema

```
Hospitais Parceiros
       ↓
   XML via API REST
       ↓
  Validação XSD
       ↓
  Transformação
       ↓
    MongoDB
       ↓
   API REST (JSON)
       ↓
  Dashboard / Clientes
```

## 📋 Estrutura do Projeto

```
Trabalho_PEI/
├── schemas/                    # Esquemas XSD para validação
│   ├── urgencia.xsd
│   ├── consulta.xsd
│   └── cirurgia.xsd
├── exemplos_xml/              # Exemplos de XMLs válidos
│   ├── urgencia_exemplo.xml
│   ├── consulta_exemplo.xml
│   └── cirurgia_exemplo.xml
├── dados_vocabulario/         # Dados CSV de teste
├── src/
│   └── core/
│       ├── api_rest/          # API REST
│       │   ├── server.js
│       │   └── routes/
│       │       ├── submissao.js   # Endpoints de submissão XML
│       │       └── relatorios.js  # Endpoints de consulta JSON
│       ├── consultas_agregacao/
│       │   ├── models/        # Modelos Mongoose
│       │   └── pipelines/     # Pipelines de agregação MongoDB
│       └── mongo/
│           ├── db/            # Conexão MongoDB
│           ├── scripts_carga/ # Scripts de carga inicial CSV
│           └── services/      # Validação e transformação
├── .env
├── package.json
└── README.md
```

## 🚀 Instalação e Configuração

### Pré-requisitos

- **Node.js** (versão 16 ou superior)
- **MongoDB** (local ou MongoDB Atlas)
- **npm** ou **yarn**

### Passos de Instalação

1. **Clonar o repositório:**
```bash
git clone https://github.com/K07-2p0/Trabalho_PEI.git
cd Trabalho_PEI
```

2. **Instalar dependências:**
```bash
npm install
```

3. **Configurar variáveis de ambiente:**

Criar/editar o ficheiro `.env` na raiz do projeto:
```env
MONGO_URI=mongodb://localhost:27017/healthtime
# Ou para MongoDB Atlas:
# MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/healthtime

PORT=3000
PATH_XSD=schemas/
```

4. **Carregar dados iniciais (CSV):**
```bash
node src/core/mongo/scripts_carga/load_csv.js
```

5. **Iniciar o servidor:**
```bash
node src/core/api_rest/server.js
```

O servidor estará disponível em `http://localhost:3000`

## 📡 Endpoints da API

### Submissão de Dados (XML)

#### POST `/submissao/urgencia`
Submete dados de urgência em formato XML.

**Exemplo de pedido:**
```bash
curl -X POST http://localhost:3000/submissao/urgencia \
  -H "Content-Type: application/xml" \
  -d @exemplos_xml/urgencia_exemplo.xml
```

#### POST `/submissao/consulta`
Submete dados de consultas em formato XML.

#### POST `/submissao/cirurgia`
Submete dados de cirurgias em formato XML.

### Consultas de Dados (JSON)

#### GET `/relatorios/media-espera-urgencia`
Obtém média de utentes em espera por tipologia e categoria de triagem.

**Parâmetros de query:**
- `dataInicio` (ISO date)
- `dataFim` (ISO date)

**Exemplo:**
```bash
curl "http://localhost:3000/relatorios/media-espera-urgencia?dataInicio=2025-01-01&dataFim=2025-12-31"
```

#### GET `/relatorios/percentagem-triagem-hospital`
Obtém percentagem por categoria de triagem num hospital.

**Parâmetros:**
- `hospitalId`
- `dataInicio`
- `dataFim`
- `periodo` (dia/semana/mes)

#### GET `/relatorios/pediatria-regiao`
Tempo médio de espera para triagem em urgências pediátricas por região.

#### GET `/relatorios/top-hospitais-pediatria`
Top 10 hospitais com menores tempos de espera em urgências pediátricas.

#### GET `/relatorios/diferenca-oncologia`
Diferença entre tempos de resposta para consultas oncológicas vs. não-oncológicas.

#### GET `/relatorios/tempo-cirurgia`
Tempo médio de espera para cirurgia programada por especialidade.

#### GET `/relatorios/evolucao-temporal`
Evolução temporal dos tempos de espera em urgências gerais (intervalos de 15 min).

## 📑 Vocabulário XML

### Urgência (Dados a cada 15 minutos)

- **Tipologia:** Geral, Pediátrica, Obstétrica, Médico-Cirúrgica, Polivalente
- **Estado:** Aberta ou Fechada
- **Utentes em espera:** Por categoria de triagem (Não Urgente, Pouco Urgente, Urgente, Muito Urgente, Emergente)
- **Utentes em observação:** Por categoria de triagem

### Consulta (Dados mensais)

- **Especialidade médica**
- **População alvo:** Adulto, Criança, Ambos
- **Listas de espera:** Geral, Não-oncológica, Oncológica
- **Tempos médios de resposta:** Por prioridade (Normal, Prioritário, Muito Prioritário)

### Cirurgia (Dados mensais)

- **Especialidade cirúrgica**
- **Listas de espera:** Geral, Não-oncológica, Oncológica
- **Tempo médio de espera:** Para cirurgia programada
- **Cirurgias realizadas:** Número total no período

## 📊 Base de Dados MongoDB

### Coleções Principais

1. **hospitais** - Informação sobre hospitais
2. **servicos** - Serviços e especialidades disponíveis
3. **urgencias** - Dados de urgências (registos de 15 em 15 min)
4. **consultas_cirurgias** - Dados mensais de consultas e cirurgias

### Abordagem de Modelagem

Foi adotada uma **abordagem híbrida**:
- **Referência:** Para dados de hospitais (evita duplicação)
- **Embebido:** Para dados de séries temporais (urgências) que são acedidos frequentemente em conjunto

## 🛠️ Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** - Base de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **fast-xml-parser** - Parsing e validação XML
- **dotenv** - Gestão de variáveis de ambiente

## 📝 Consultas Analíticas Implementadas

Todas as consultas pedidas no enunciado estão implementadas como pipelines de agregação MongoDB em `src/core/consultas_agregacao/pipelines/`:

1. ✅ Média de utentes em espera por tipologia e triagem
2. ✅ Percentagem por categoria de triagem
3. ✅ Tempo médio de espera em urgências pediátricas por região
4. ✅ Diferença entre tempos de oncologia vs. não-oncologia
5. ✅ Tempo médio de espera para cirurgia programada
6. ✅ Discrepância entre consultas e cirurgias
7. ✅ Top 10 hospitais com menores tempos (pediatria)
8. ✅ Evolução temporal com identificação de picos

## 👥 Equipa

- **Adriano Oliveira** - adrianofsoliveira@gmail.com

## 📝 Licença

Este projeto foi desenvolvido no âmbito da Unidade Curricular de **Persistência e Exploração de Informação (PEI)** do curso **LEI/LSIRC** da **ESTG** no ano letivo 2025/2026.

---

Última atualização: Dezembro 2025