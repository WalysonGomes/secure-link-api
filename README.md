# Secure Link API — MVP

API backend desenvolvida em **Java + Spring Boot** para criação e compartilhamento de links seguros, com controle de expiração e número máximo de acessos.

Este projeto foi desenvolvido com foco em **aprendizado prático**, arquitetura limpa e aplicação de conceitos utilizados no mercado, partindo de um **MVP bem definido** e evolutivo.

## Objetivo do Projeto

Permitir que um serviço ou usuário:

- Faça upload de um arquivo
- Gere um link curto e único
- Defina:
  - data de expiração
  - número máximo de visualizações
- Compartilhe esse link
- Garanta que o arquivo ou link:
  - expire automaticamente
  - seja invalidado após atingir o limite de acessos

## O que é o MVP neste projeto?

O **MVP (Minimum Viable Product)** representa a **menor versão funcional e completa** do produto, capaz de entregar valor real e validar o fluxo principal da aplicação.

### MVP inclui:

- Criação de links seguros
- Upload de arquivos via multipart
- Criação de link encurtado para URLs externas
- Resolução do link (`/l/{code}`)
- Controle de:
  - expiração
  - número máximo de acessos
- Persistência em banco **H2**
- Tratamento padronizado de erros
- Testes unitários básicos

## Arquitetura Geral

```
Controller (HTTP)
   ↓
Service (Regras de negócio)
   ↓
Repository (JPA)
   ↓
H2 Database
```

Princípios adotados:

- Separação clara de responsabilidades
- Services pequenos e focados
- Código orientado a domínio
- Facilidade de evolução pós-MVP

## Tecnologias Utilizadas

- Java 21+
- Spring Boot
- Spring Web
- Spring Data JPA
- H2 Database (MVP)
- Multipart File Upload
- NanoID (geração de códigos curtos)
- Lombok
- Maven

## Estrutura de Pacotes (simplificada)

```
br.com.walyson.secure_link
 ├── controller
 ├── service
 ├── repository
 ├── domain
 ├── dto
 ├── utils
 ├── exception
 └── config
```

## Fluxo Principal do MVP

### upload de arquivo + criação do link

**Endpoint**

```http
POST /links/upload
Content-Type: multipart/form-data
```

**Parâmetros**

- `file` (MultipartFile) — obrigatório
- `expiresAt` (Instant) — opcional
- `maxViews` (Integer) — opcional

**Exemplo com curl**

```bash
curl -X POST http://localhost:8080/links/upload \
  -F "file=@temp/test.txt" \
  -F "expiresAt=2026-02-01T23:59:59Z" \
  -F "maxViews=3"
```

**Resposta**

```json
{
  "shortCode": "RTgJDgla",
  "accessUrl": "http://localhost:8080/l/RTgJDgla",
  "expiresAt": "2026-02-01T23:59:59Z",
  "maxViews": 3
}
```

### Criação de link encurtado (para URL externa)

**Endpoint**

```http
POST /links/create
Content-Type: application/json
```

**Parâmetros**

```json
{
  "targetUrl": "https://example.com/original",
  "expiresAt": "2026-02-01T23:59:59Z",
  "maxViews": 3
}
```

**Exemplo com curl**

```bash
curl -X POST http://localhost:8080/links/create \
  -H "Content-Type: application/json" \
  -d '{"targetUrl": "https://example.com/original", "expiresAt": "2026-02-01T23:59:59Z", "maxViews": 3}'
```

**Resposta**

```json
{
  "shortCode": "aBc123XY",
  "accessUrl": "http://localhost:8080/l/aBc123XY",
  "expiresAt": "2026-02-01T23:59:59Z",
  "maxViews": 3
}
```

**Comportamento ao acessar `/l/{shortCode}`**

- HTTP 302 (Found) → redireciona para `targetUrl` se definido
- Expiração e número máximo de acessos são respeitados
- Se o link não existe → HTTP 404
- Se atingiu limite de visualizações → HTTP 410 (Gone)

### Acesso ao link seguro (comportamento genérico)

**Endpoint**

```http
GET /l/{shortCode}
```

**Validações**

- Link existe?
- Link expirado?
- Número máximo de visualizações atingido?

**Se for um arquivo:** retorna o conteúdo com cabeçalho `Content-Disposition`
**Se for URL externa:** retorna 302 redirect

**Exemplo curl (arquivo)**

```bash
curl -v http://localhost:8080/l/RTgJDgla
```

**Exemplo curl (URL externa)**

```bash
curl -v http://localhost:8080/l/aBc123XY
```

## Regras de Negócio Aplicadas

- Código curto **único**
- Link inválido se:
  - expirado
  - número máximo de acessos atingido
- Arquivo armazenado no filesystem (para upload)
- Persistência desacoplada da lógica de upload
- Possibilidade de redirecionamento para URL externa (encurtador)

## Padronização de Erros

O projeto utiliza `@ControllerAdvice` para:

- Erros de validação
- Link não encontrado
- Link expirado
- Limite de acessos atingido
- Erros internos (IO, filesystem, mapping)

**Formato padrão**

```json
{
  "timestamp": "2026-01-29T16:21:38.073Z",
  "status": 404,
  "error": "Not Found",
  "message": "Link expired",
  "path": "/l/RTgJDgla"
}
```

## Testes

O MVP inclui testes unitários focados em:

- Services
- Regras de negócio
- Validação de cenários críticos

Ferramentas:

- JUnit 5
- Mockito

## Configuração (application.properties para MVP)

```properties
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driver-class-name=org.h2.Driver
spring.jpa.hibernate.ddl-auto=update

app.base-url=http://localhost:8080
app.storage.path=/tmp/uploads/
```

## Próximos Passos (Pós-MVP)

- Migrar H2 → MySQL
- Autenticação (JWT)
- Links privados
- Download auditado
- Expiração automática com Scheduler
- Rate limit
- Frontend em Angular
- Dockerização
- Observabilidade (logs, métricas)

Author: Walyson Gomes
