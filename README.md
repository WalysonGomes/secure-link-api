# Secure Link — Fullstack (API + Client)

Projeto fullstack para criação, distribuição e controle de links seguros.

- **Backend**: Java + Spring Boot (API REST)
- **Frontend**: Angular Standalone + Tailwind + daisyUI

> Objetivo: permitir compartilhar URLs/arquivos com regras de segurança (senha, expiração, limite de acessos), revogar links e acompanhar métricas via dashboard.

## Visão geral

### Funcionalidades principais

- Criar link seguro para **URL externa**
- Criar link seguro para **upload de arquivo**
- Proteger link com **senha**
- Definir **expiração** e **limite de visualizações**
- **Revogar** link manualmente
- Auditar acessos e falhas
- Exibir métricas em dashboard (`/api/stats/**`)

### Arquitetura (alto nível)

```text
frontend/secure-link-client (Angular)
        │
        ▼
backend (Spring Boot REST API)
        │
        ▼
MySQL (dev/prod) | H2 (test)
```

## Stack

### Backend

- Java 21+
- Spring Boot
- Spring Web / Spring Data JPA
- Flyway
- MySQL (dev/prod) / H2 (tests)
- Micrometer + Actuator + Prometheus
- BCrypt / NanoID
- Maven

### Frontend

- Angular (Standalone Components)
- TypeScript
- Angular Router / HttpClient
- Tailwind CSS v3
- daisyUI
- Remix Icon
- Yarn

## Estrutura do repositório

```text
.
├── backend
│   └── src/main/java/br/com/walyson/secure_link
└── frontend
    └── secure-link-client
```

## Modo de uso (Backend + Frontend)

### Pré-requisitos

- Java 21+
- Maven 3.9+
- Node.js 20+
- Yarn 1.22+
- MySQL (para backend no perfil `dev`)

### 1) Subir backend

```bash
cd backend
SPRING_PROFILES_ACTIVE=dev mvn spring-boot:run
```

Backend padrão: `http://localhost:8080`.

### 2) Configurar frontend

```bash
cd frontend/secure-link-client
cp .env.example .env
```

No `.env`, ajuste a URL da API:

```env
NG_APP_API_BASE_URL=http://localhost:8080/
```

### 3) Subir frontend

```bash
cd frontend/secure-link-client
yarn install
yarn start
```

Frontend padrão: `http://localhost:4200`.

### Build do frontend

```bash
cd frontend/secure-link-client
yarn build
```

## Configuração de API no frontend

O token `API_BASE_URL` usa variável de ambiente em tempo de build (`import.meta.env`):

1. `NG_APP_API_BASE_URL` (preferencial)
2. `API_BASE_URL` (fallback)
3. fallback final: `http://localhost:8080/`

Arquivo: `frontend/secure-link-client/src/app/core/config/api.config.ts`.

## Endpoints principais

### Criação de link (URL)

```http
POST /api/links
```

### Criação de link (upload)

```http
POST /api/links/upload
```

### Resolução de link

```http
GET /l/{shortCode}
```

### Revogação

```http
DELETE /l/{shortCode}
```

### Estatísticas

```http
GET /api/stats/links
GET /api/stats/access/summary
GET /api/stats/access/hourly
GET /api/stats/access/daily
GET /api/stats/access/failures
GET /api/stats/links/top?limit=5
GET /api/stats/security/exceptions?limit=5
```

## Fluxo de criação e resolução

- ![Home page Dark mode](./assets/home dark.png)
- ![Home page Light mode](./assets/home light.png)
- ![Create Redirect Link](./assets/redirect link.gif)
- ![Create Download Link](./assets/download link.gif)
- ![Revoke Link](./assets/revoke link.gif)

### Dashboard do Client

- ![Dashoboard Dark Mode](./assets/dashboard dark.png)
- ![Dashoboard Light Mode](./assets/dashboard light.png)

## Observabilidade

- `X-Correlation-Id` para rastreabilidade por requisição
- Tratamento padronizado de erros com `errorId`
- Métricas técnicas e de negócio via Actuator/Micrometer

## Status

- Projeto fullstack em evolução contínua
- API e Client integrados localmente
