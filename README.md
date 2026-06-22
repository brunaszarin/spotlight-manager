# Spotlight Manager

Aplicativo embedded para Shopify que permite a lojistas destacar produtos na loja com badges personalizados (texto + cor), sem precisar editar o tema manualmente.

Projeto construído como portfólio técnico para demonstrar conhecimento prático da plataforma Shopify: Admin API, App Bridge, Theme App Extensions, autenticação OAuth, webhooks e infraestrutura de CI/CD.

**App em produção:** https://spotlight-manager-production.up.railway.app

---

## O que o app faz

1. O lojista acessa o app pelo Admin da Shopify e cria um "spotlight": escolhe um produto da loja (via `ResourcePicker`), define um texto de badge e uma cor.
2. O spotlight é salvo num banco PostgreSQL.
3. Um **App Block** instalável no tema (via Theme Editor) busca esse dado através de uma API pública e renderiza o badge na página do produto, no storefront — sem o lojista precisar editar código Liquid.
4. Quando um produto é deletado na loja, um webhook remove automaticamente os spotlights associados a ele.

---

## Arquitetura

**Admin App (embedded)** — React Router + Polaris. Roda dentro do iframe do Admin da Shopify. Responsável por criar, editar e excluir spotlights.

**Theme App Extension** — App Block escrito em Liquid + JavaScript. Roda no storefront (página do produto) e busca os dados via `fetch()`.

**API pública** (`/api/spotlight`) — ponte entre os dois mundos acima. Sem autenticação de admin (o cliente final não tem sessão), com CORS liberado, retornando apenas dados não sensíveis.

**Banco de dados** — PostgreSQL no Railway, acessado via Prisma, compartilhado entre o Admin App e a API pública.

Fluxo resumido:

```
Admin App  -->  banco PostgreSQL (Prisma)  -->  API pública  -->  Theme App Extension  -->  Storefront
```

---

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | React Router v7 (Shopify App template) |
| UI Admin | Polaris + App Bridge |
| Linguagem | TypeScript |
| ORM / Banco | Prisma + PostgreSQL |
| Testes | Vitest (testes unitários da camada de dados e da API) |
| CI/CD | GitHub Actions (lint, typecheck, testes) + deploy automático no Railway |
| Hosting | Railway |
| Storefront | Theme App Extension (Liquid + JavaScript vanilla) |

---

## Funcionalidades implementadas

- **OAuth e instalação** via Shopify CLI / `shopify-app-react-router`
- **Dashboard administrativo** com `Polaris IndexTable`, listando spotlights criados
- **Criação e edição** de spotlights com `ResourcePicker` (seleção de produto real da loja) e `ColorPicker`
- **Exclusão** de spotlights com confirmação
- **Webhook `products/delete`**: remove spotlights automaticamente quando o produto associado é deletado na loja
- **API pública** (`/api/spotlight`) consumida pelo storefront, com CORS configurado
- **Theme App Extension**: App Block que renderiza o badge na página de produto, configurável pelo lojista via Theme Editor
- **CI/CD completo**: lint, typecheck e testes automatizados em todo PR; deploy automático para produção a cada merge na `main`

---

## Decisões técnicas e trade-offs

**Navegação client-side obrigatória em apps embedded**

Dentro do iframe do Admin, qualquer navegação (links e redirects de `action`) precisa ser feita via `useNavigate`/`useFetcher` do React Router. Usar `<a href>`, a prop `url` direta do Polaris `Button`, ou `Response.redirect()` do servidor faz o Admin tentar tratar a navegação como saída de página, quebrando o contexto do App Bridge.

**Autenticação da API pública**

A rota `/api/spotlight`, consumida pelo storefront, não usa `authenticate.admin` (não há sessão de admin no contexto do cliente final). Para dados não sensíveis (texto/cor de um badge), a verificação por `shop` + `productId` na query string foi considerada suficiente. Para dados sensíveis, a abordagem mais robusta seria um **App Proxy**, que assina a requisição através do domínio da própria loja.

**PostgreSQL em vez de SQLite**

O template padrão do Shopify usa SQLite, adequado apenas para instância única. Como o deploy roda no Railway (que recicla containers e não garante volume persistente entre deploys), o projeto foi migrado para PostgreSQL desde o início do desenvolvimento.

---

## Estrutura do projeto

```
app/routes/app._index.tsx              Dashboard (lista de spotlights)
app/routes/app.spotlight.new.tsx       Criacao de spotlight
app/routes/app.spotlight.$id.tsx       Edicao de spotlight
app/routes/api.spotlight.tsx           API publica consumida pelo storefront
app/routes/webhooks.products.delete.tsx
app/routes/__tests__/                  Testes de rotas
app/lib/spotlight.server.ts            Camada de acesso a dados (Prisma)
app/shopify.server.ts                  Configuracao de auth e API

extensions/spotlight-badge/blocks/spotlight-badge.liquid   App Block

prisma/schema.prisma                   Modelos Session e Spotlight
```

---

## Rodando localmente

### Pré-requisitos

- Node.js 20.19+ ou 22.12+
- Conta no [Shopify Partners](https://partners.shopify.com) com uma loja de desenvolvimento
- Banco PostgreSQL (local ou um serviço gratuito como Railway/Supabase)

### Setup

```bash
npm install
```

Cria um `.env` na raiz com:

```
DATABASE_URL="postgresql://usuario:senha@host:porta/database"
```

Gera o client do Prisma e aplica as migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

Inicia o servidor de desenvolvimento (abre um tunnel e conecta à loja de dev):

```bash
shopify app dev
```

### Testes

```bash
npm run test
npm run test:watch
npm run lint
npm run typecheck
```

---

## CI/CD

- `.github/workflows/ci.yml`: roda em todo PR para `main`/`develop` — lint, typecheck e testes.
- `.github/workflows/deploy.yml`: dispara deploy automático no Railway a cada push na `main`.
- Branch `main` protegida: exige PR e checks de CI verdes antes de merge.
