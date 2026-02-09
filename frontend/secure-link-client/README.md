# Secure Link Client

Frontend Angular (standalone) para integração com **Secure Link API v1.0.0-api**.

## Funcionalidades

- Fluxo único para criar link seguro via **URL** (`POST /api/links`) ou **arquivo** (`POST /api/links/upload`)
- Resultado com `accessUrl`, botão de copiar e abrir
- Helper **Open secure link** com suporte a senha (`X-Link-Password`) e retry em modal
- Ação rápida de **revoke** (`DELETE /l/{shortCode}`)
- Dashboard em `/stats` consumindo:
  - `/api/stats/links`
  - `/api/stats/access/summary`
  - `/api/stats/access/hourly`
  - `/api/stats/access/daily`
  - `/api/stats/access/failures`
  - `/api/stats/links/top?limit=5`
  - `/api/stats/security/exceptions?limit=5` (opcional)

## Stack

- Angular + Standalone Components
- Angular Router
- Angular HttpClient
- Tailwind CSS + daisyUI
- Remix Icon (CDN)
- Yarn

## Configuração

A base da API pode ser definida em runtime via variável global:

```html
<script>
  window.__secureLinkApiBaseUrl = 'http://localhost:8080';
</script>
```

Se não for definida, o client usa `http://localhost:8080` como fallback.

## Rodando local

```bash
yarn start
```

App: `http://localhost:4200`
