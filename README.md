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
┌──────────────────────────┐         ┌───────────────────────────┐

│   Admin App (embedded)    │         │   Theme App Extension      │

│   React Router + Polaris  │         │   App Block (Liquid + JS)  │

│   - Cria/edita/exclui      │         │   - Roda no storefront      │

│     spotlights              │         │   - Busca via fetch()        │

└─────────────┬──────────────┘         └─────────────┬────────────┘

│                                       │

│     API pública (/api/spotlight)       │

└───────────────────┬───────────────────┘

│

PostgreSQL (Railway) via Prisma

- **Admin App**: rotas autenticadas via OAuth (`authenticate.admin`), usadas pelo lojista.
- **API pública**: rota sem autenticação de admin, consumida pelo JavaScript do tema (CORS liberado), retornando apenas dados não sensíveis (texto e cor do badge).
- **Theme App Extension**: bloco Liquid instalável visualmente no Theme Editor, que faz a ponte entre o storefront e a API do app.

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
app/

├── routes/

│   ├── app._index.tsx              # Dashboard (lista de spotlights)

│   ├── app.spotlight.new.tsx       # Criação de spotlight

│   ├── app.spotlight.$id.tsx       # Edição de spotlight

│   ├── api.spotlight.tsx           # API pública consumida pelo storefront

│   ├── webhooks.products.delete.tsx

│   └── tests/                  # Testes de rotas (fora do file-based routing)

├── lib/

│   └── spotlight.server.ts         # Camada de acesso a dados (Prisma)

└── shopify.server.ts                # Configuração de auth e API
extensions/

└── spotlight-badge/

└── blocks/

└── spotlight-badge.liquid   # App Block do Theme App Extension
prisma/

└── schema.prisma                    # Modelos Session e Spotlight

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
DATABASE_URL="postgresql://usuario:senha@host:porta/database"

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
npm run test           # roda os testes uma vez
npm run test:watch     # modo watch
npm run lint            # ESLint
npm run typecheck       # verificação de tipos
```

---

## CI/CD

- **`.github/workflows/ci.yml`**: roda em todo PR para `main`/`develop` — lint, typecheck e testes.
- **`.github/workflows/deploy.yml`**: dispara deploy automático no Railway a cada push na `main`.
- Branch `main` protegida: exige PR e checks de CI verdes antes de merge.