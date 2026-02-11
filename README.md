# Secure Link API — v1.0.0-api

API backend desenvolvida em **Java + Spring Boot** para criação, gerenciamento e auditoria de links seguros, com controle de expiração, limite de acessos, proteção por senha e métricas de uso.

Este projeto foi desenvolvido com foco em **aprendizado prático avançado**, arquitetura limpa, domínio rico e **observabilidade aplicada ao negócio**, partindo de um MVP e evoluindo para uma **API backend completa e pronta para consumo por um client**.

## Objetivo do Projeto

Permitir que um serviço ou usuário:

- Faça upload de arquivos
- Gere links curtos e únicos
- Encurte URLs externas
- Defina regras de acesso:
  - data de expiração
  - número máximo de visualizações
  - proteção por senha
- Revogue links manualmente
- Audite **todas** as tentativas de acesso
- Extraia métricas reais de uso e segurança

## Visão Geral da Arquitetura

```
Controller (HTTP)
    ↓
Service (Regras de Negócio / Domínio)
    ↓
Repository (JPA + Projections)
    ↓
MySQL / H2

```

### Princípios adotados

- Modelo de domínio rico (`SecureLink`)
- Services pequenos e focados
- Auditoria desacoplada (transação independente)
- Métricas orientadas a produto
- Facilidade de evolução sem quebrar contratos

## Tecnologias Utilizadas

- Java 21+
- Spring Boot
- Spring Web
- Spring Data JPA
- MySQL 8.4 (dev / prod)
- H2 Database (test)
- Flyway
- Spring Actuator
- Micrometer + Prometheus
- BCrypt
- NanoID
- Lombok
- Maven

## Modo de uso (Backend + Frontend)

### Pré-requisitos

- Java 21+
- Maven 3.9+
- Node.js 20+
- Yarn 1.22+
- MySQL (para perfil `dev` do backend)

### Backend

```bash
cd backend
SPRING_PROFILES_ACTIVE=dev mvn spring-boot:run
```

Backend padrão: `http://localhost:8080`.

### Frontend

```bash
cd frontend/secure-link-client
cp .env.example .env
```

No `.env`, configure:

```env
NG_APP_API_BASE_URL=http://localhost:8080/
```

Depois execute:

```bash
yarn install
yarn start
```

Frontend padrão: `http://localhost:4200`.

## Estrutura de Pacotes (simplificada)

```
br.com.walyson.secure_link
 ├── config
 ├── controller
 ├── domain
 ├── dto
 ├── exceptions
 ├── health
 ├── infra
 ├── repository
 ├── security
 ├── service
 └── utils

```

## Endpoints Principais

### Criação de link para URL externa

**Endpoint**

```http
POST /api/links
Content-Type: application/json

```

**Request**

```json
{
  "targetUrl": "https://example.com",
  "expiresAt": "2026-12-31T23:59:59Z",
  "maxViews": 10,
  "password": "link_password"
}
```

**Response**

```json
{
  "shortCode": "abc12345",
  "accessUrl": "http://localhost:8080/l/abc12345",
  "expiresAt": "2026-12-31T23:59:59Z",
  "maxViews": 10
}
```

### Upload de arquivo + criação de link

**Endpoint**

```http
POST /api/links/upload
Content-Type: multipart/form-data

```

**Parâmetros**

- `file` (MultipartFile) — obrigatório

- `expiresAt` — opcional

- `maxViews` — opcional

- `password` — opcional

**Demonstração visual**

- [adicione um gif aqui: upload de arquivo + criação de link]
- [adicione uma imagem aqui: retorno de sucesso da criação de link]

## Resolução do Link (`/l/{shortCode}`)

**Endpoint**

```http
GET /l/{shortCode}

```

### Máquina de validação aplicada

1. Link existe?

2. Link foi revogado?

3. Link expirou?

4. Limite de visualizações atingido?

5. Senha requerida?

6. Senha válida?

### Comportamento

| Situação        | Resposta                   |
| --------------- | -------------------------- |
| Link não existe | 404                        |
| Revogado        | 410                        |
| Expirado        | 410                        |
| Limite atingido | 410                        |
| Senha ausente   | 401                        |
| Senha inválida  | 401                        |
| Sucesso         | 302 (redirect) ou download |


## Acesso a links protegidos por senha

Quando um link é criado com proteção por senha, **a senha deve ser enviada via header HTTP**.

### Header esperado

```
X-Link-Password: <password>

```

> A senha **não deve** ser enviada via query parameters ou body da requisição.

### Demonstração visual

- [adicione um gif aqui: tentativa de acesso com senha]
- [adicione uma imagem aqui: resposta de acesso autorizado]

## Revogação de Link

Revoga manualmente um link, tornando-o imediatamente inacessível.

**Endpoint**

```http
DELETE /l/{shortCode}

```

**Resposta**

```http
204 No Content

```

- Revogar link ativo → sucesso

- Revogar link inexistente → 404

- Revogar link já revogado → no-op

## Endpoints de Estatísticas (`/api/stats`)

### Resumo geral de acessos

```http
GET /api/stats/access/summary

```

**Response**

```json
{
  "total": 1000,
  "success": 850,
  "failed": 150,
  "expired": 40,
  "uniqueOrigins": 320,
  "accessEfficiencyRatio": 85.0,
  "expirationAttritionRate": 4.0
}
```

Distribuição horária de acessos

```http
GET /api/stats/access/hourly

```

```json
[
  { "hour": 14, "count": 150 },
  { "hour": 15, "count": 230 }
]
```

Exceções de segurança

```http
GET /api/stats/security/exceptions?limit=5

```

```json
[{ "shortCode": "abc12345", "count": 12 }]
```

Falhas por tipo

```http
GET /api/stats/access/failures

```

Acessos diários

```http
GET /api/stats/access/daily

```

Status dos links

```http
GET /api/stats/links

```

```json
{
  "active": 42,
  "expired": 18,
  "revoked": 7
}
```

Links mais acessados

```http
GET /api/stats/links/top?limit=5

```

### Dashboard do Client (placeholders de mídia)

- [adicione um gif aqui: visão geral do dashboard carregando os cards principais]
- [adicione uma imagem aqui: tabela de Top Links e Falhas]
- [adicione uma imagem aqui: gráfico/barras de Volume por hora]
- [adicione uma imagem aqui: gráfico/barras de Volume por dia]
- [adicione uma imagem aqui: tabela de Exceções de segurança]

## Testes

O projeto possui **testes unitários focados em regras de negócio**, cobrindo:

- Criação de links
- Upload de arquivos
- Resolução de links (todos os estados)
- Revogação
- Expiração automática
- Auditoria de acessos
- Métricas (Micrometer)

**Ferramentas**

- JUnit 5
- Mockito
- H2 Database (perfil `test`)
- SimpleMeterRegistry

## Rastreabilidade e Diagnóstico

O sistema implementa mecanismos avançados de observabilidade para facilitar o debug em produção:

- **X-Correlation-Id**: Toda requisição gera ou recebe um identificador único no header da resposta . Esse ID é injetado no log (MDC), permitindo rastrear o fluxo completo de uma transação entre diferentes serviços.

- **Reference ID**: Em caso de erro 500, o cliente recebe um `errorId` amigável. O desenvolvedor pode localizar o stacktrace exato no log buscando por esse ID, garantindo que detalhes sensíveis da infraestrutura nunca sejam expostos.

## Padronização de Erros

Todas as exceções são tratadas via `@RestControllerAdvice`.

Exemplo de erro

```json
{
  "timestamp": "2026-02-06T16:38:18.456Z",
  "status": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred. Reference ID: 342cf159-d367-4b40-8e23-0e1a0f7f4d6d",
  "path": "/api/stats/access/summary"
}
```

- Erros 500 geram `errorId`

- Stacktrace **não é exposto ao cliente**

- Logs internos mantêm rastreabilidade completa

## Saúde e Telemetria

A API expõe sua vitalidade operacional através do **Spring Actuator**:

- **Health Check**: `GET /actuator/health`
- Monitora: Conectividade MySQL , integridade do File System (Storage) e execução do Job de expiração.

- **Métricas Prometheus**: `GET /actuator/prometheus`
- Expõe contadores técnicos e métricas de negócio (ex: `secure_link_resolve_success_total`).

## Perfis e Execução

O projeto utiliza **Spring Profiles**:

| Perfil | Uso                           |
| ------ | ----------------------------- |
| `dev`  | Desenvolvimento local (MySQL) |
| `prod` | Produção                      |
| `test` | Testes automatizados (H2)     |

### Executar localmente

```bash
SPRING_PROFILES_ACTIVE=dev mvn spring-boot:run

```

## Estado Atual do Projeto

- API **feature complete**
- Backend pronto para consumo por frontend
- Tag atual: `v1.0.0-api`
- Próximo passo: **client (frontend)**

Author: **Walyson Gomes**
