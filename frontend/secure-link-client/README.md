# Secure Link Client

Frontend Angular standalone para o Secure Link API v1.0.0-api.

## Stack

- Angular + Router + HttpClient
- Tailwind CSS v3 + daisyUI
- Remix Icon (CDN)
- Yarn

## Executar

```bash
yarn install
yarn start
```

## Configuração de API

Por padrão, o client usa `http://localhost:8080`.

Você pode sobrescrever em runtime antes do bootstrap:

```html
<script>
  window.__SECURE_LINK_API_BASE_URL__ = 'http://localhost:8080';
</script>
```

## Funcionalidades

- Home com fluxo único URL/arquivo (mutuamente exclusivo)
- Opções avançadas: expiração, max views, senha
- Helper para abrir link seguro com retry de senha (`X-Link-Password`)
- Revogação de link via shortCode
- Dashboard `/stats` com refresh e polling leve (20s)
- Interceptor de `X-Correlation-Id`
- Interceptor de erro padronizado com `errorId`
