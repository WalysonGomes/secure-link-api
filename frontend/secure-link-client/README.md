# Secure Link Client

Frontend Angular (standalone) para a Secure Link API v1.0.0-api.

## Stack

- Angular standalone + Router + HttpClient
- Tailwind CSS v3 + daisyUI
- Remix Icon (CDN)
- Yarn

## Configuração de API

Por padrão o client chama `http://localhost:8080`.

Você também pode definir em runtime:

```html
<script>
  window.__APP_CONFIG__ = { apiBaseUrl: 'http://localhost:8080' };
</script>
```

## Fluxos implementados

- Home com fluxo único URL/arquivo (mutuamente exclusivo)
- Opções avançadas: expiração, limite de views e senha
- Criação de link (`POST /api/links`) e upload (`POST /api/links/upload`)
- Helper “Open secure link” com retry por senha (`X-Link-Password`)
- Revogação pública (`DELETE /l/{shortCode}`)
- Dashboard em `/stats` com endpoints `/api/stats/**` e refresh/polling 20s

## Observabilidade mínima

- Interceptor para `X-Correlation-Id` em todas as requests
- Interceptor para normalizar erros e expor `errorId`

## Scripts

```bash
yarn start
yarn build
yarn test
```
