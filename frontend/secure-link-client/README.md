# Secure Link Client

Frontend Angular (standalone) para o Secure Link API.

## Stack

- Angular + TypeScript + Angular Router + HttpClient
- Tailwind CSS v3 + daisyUI
- Remix Icon (CDN)
- Yarn

## Rodando local

```bash
yarn install
yarn start
```

Aplicação disponível em `http://localhost:4200`.

## Build

```bash
yarn build
```

## Configuração de API

O client usa `API_BASE_URL` (default: `/`) em `src/app/core/config/api.config.ts`.
Se o backend estiver em outro host, altere o provider no `app.config.ts`.

## Funcionalidades implementadas

- Home unificada com tabs (URL/Arquivo) e dropzone com drag-and-drop
- Criação de link seguro via `POST /api/links` e upload via `POST /api/links/upload`
- Configurações opcionais de segurança (senha, expiração, max views)
- Card de sucesso com ações rápidas de cópia/abertura
- Helper **Open secure link** com retry por senha (`X-Link-Password`)
- Revogação rápida (`DELETE /l/{shortCode}`) com botão destrutivo
- Dashboard com cards `stats`, barras de volume (hora/dia) e tabelas `/api/stats/**`
- Refresh manual + polling leve (20s) + skeleton loading
- Empty states ricos com ícones e mensagens orientativas
- Interceptors:
  - `X-Correlation-Id` em toda request
  - normalização de erro com suporte a `errorId`
- Toasts globais para erros de API
- Navbar sticky com status da API e toggle de tema light/dark
