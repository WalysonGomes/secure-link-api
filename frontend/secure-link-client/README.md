# Secure Link Client

Frontend Angular (standalone) para integração com **Secure Link API v1.0.0-api**.

## Requisitos

- Node.js 20+
- Yarn 1.22+
- Backend Secure Link API rodando em `http://localhost:8080` (ou outra URL configurada)

> Angular CLI não é obrigatório globalmente (os scripts usam o CLI local do projeto).

## Stack

- Angular + Standalone Components
- Angular Router
- Angular HttpClient
- Tailwind CSS + daisyUI
- Remix Icon (CDN)
- Yarn

## Instalação e execução

```bash
yarn install
yarn start
```

- Frontend: `http://localhost:4200`
- API default: `http://localhost:8080`

## Configuração de API Base URL

A base da API é configurada por `InjectionToken` (`API_BASE_URL`) com fallback para `http://localhost:8080`.

Arquivo: `src/app/core/config/api.config.ts`

Também é possível sobrescrever em runtime com variável global no `index.html`:

```html
<script>
  window.__secureLinkApiBaseUrl = 'http://localhost:8080';
</script>
```


## Configuração de links do header

URL do botão **GitHub** em `src/app/core/config/app.config.ts` (`APP_CONFIG.githubUrl`).

## Pré-requisitos do backend para testes locais

- Backend rodando e acessível por HTTP
- CORS liberado para `http://localhost:4200`
- Endpoints disponíveis:
  - `POST /api/links`
  - `POST /api/links/upload`
  - `GET /l/{shortCode}`
  - `DELETE /l/{shortCode}`
  - `GET /api/stats/**`

## Fluxos de teste rápido

### 1) Criar link por URL

1. Acesse `/`
2. Preencha **Target URL**
3. (Opcional) defina expiração/max views/password
4. Clique em **Generate link**
5. Valide **Copy** e **Open**

### 2) Upload de arquivo

1. Acesse `/`
2. Selecione um arquivo em **Upload file**
3. Clique em **Generate link**
4. Valide `accessUrl` gerada

### 3) Open secure link (com senha)

1. Em **Open secure link**, informe shortCode ou URL `/l/{shortCode}`
2. Para link protegido, o modal de senha será aberto
3. Teste senha inválida (modal permanece com feedback)
4. Teste senha válida (abre URL ou baixa arquivo)

### 4) Revoke

1. Em **Revoke link**, informe shortCode
2. Confirme a ação
3. Valide comportamento para `204` e `404`

### 5) Stats + Refresh

1. Acesse `/stats`
2. Verifique cards e tabelas
3. Clique em **Refresh**
4. Verifique **Last updated** e polling automático leve (20s)

## Scripts

```bash
yarn start      # ng serve
yarn build      # build produção
yarn test       # testes unitários
```
