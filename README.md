# Plataforma de Treinamentos — LMS Corporativo

Plataforma interna de cursos corporativos: administradores criam e organizam
treinamentos (módulos, aulas, apresentações), atribuem a colaboradores e
acompanham o progresso; colaboradores estudam os cursos atribuídos, marcam
aulas como concluídas e consultam seu histórico.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router, React Server Components) |
| Linguagem | TypeScript (strict) |
| UI | Tailwind CSS + componentes próprios sobre Radix UI |
| Ícones | lucide-react |
| Tipografia | IBM Plex Sans (títulos) + Inter (texto), self-hosted via `@fontsource` |
| Banco de dados | PostgreSQL |
| ORM | Prisma |
| Autenticação | Auth.js v5 (NextAuth), Credentials + JWT |
| Hash de senha | bcrypt |
| Validação | Zod |
| Markdown das aulas | `react-markdown` + `remark-gfm` + `rehype-sanitize` |
| Apresentações | Upload de PDF, exibido em proporção 16:9 via `<iframe>` |
| Gráficos | Recharts |

Todas as decisões técnicas relevantes (e as alternativas descartadas) estão
documentadas nos comentários dos arquivos correspondentes e foram resumidas
na conversa de planejamento deste projeto.

---

## Estrutura de pastas

```
app/
├── (auth)/              # login, trocar-senha
├── (colaborador)/        # home, cursos, aula, perfil, histórico
├── admin/                # dashboard, usuários, cursos, categorias, progresso
└── api/                  # rota do NextAuth + upload de arquivos

components/
├── ui/                   # Button, Input, Dialog, Table, Badge, Toast…
├── courses/              # CourseCard, MarkdownRenderer, LessonNavigation…
├── admin/                # CourseBuilder, AssignCourseForm, gráficos…
├── layout/                # Sidebar, Header, AdminSidebar
└── auth/

lib/
├── auth/                 # permissões (requireUser/requireAdmin), senha padrão
├── actions/               # Server Actions (única porta de entrada de escrita)
├── services/               # regras de negócio (fonte única da verdade)
├── validations/            # schemas Zod
└── db/                    # cliente Prisma

prisma/
├── schema.prisma
└── seed.ts
```

**Regra de arquitetura:** toda regra de negócio vive em `lib/services/`.
Server Actions (`lib/actions/`) apenas validam entrada com Zod, checam
permissão (`requireUser`/`requireAdmin`) e delegam ao service. Nenhuma
página ou componente acessa o Prisma diretamente para escrever dados.

---

## Como rodar localmente

### 1. Pré-requisitos
- Node.js 20+
- PostgreSQL 14+ (local, Docker, ou um serviço gerenciado)

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
```bash
cp .env.example .env
```
Edite `.env` e preencha `DATABASE_URL` com a string de conexão do seu
Postgres, e gere um `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

Se preferir subir um Postgres local rapidamente com Docker:
```bash
docker run --name lms-postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=lms_corporativo -p 5432:5432 -d postgres:16
```
E use `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lms_corporativo"`.

### 4. Rodar as migrations e o seed
```bash
npx prisma migrate dev --name init
npm run db:seed
```

O seed cria:
- Um administrador: **admin@empresa.local** / **Admin@123**
- Cinco colaboradores de exemplo (senha **Colaborador@123**), em 4 departamentos
- 6 categorias
- 3 cursos publicados, com módulos, aulas e conteúdo em Markdown, todos
  atribuídos aos colaboradores de exemplo

> ⚠️ Troque essas senhas em qualquer ambiente que não seja puramente local/demonstração.

### 5. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
Acesse http://localhost:3000.

---

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Gera o Prisma Client e faz o build de produção |
| `npm run start` | Inicia o build de produção |
| `npm run db:migrate` | Cria/aplica migrations em desenvolvimento |
| `npm run db:deploy` | Aplica migrations em produção (sem gerar novas) |
| `npm run db:seed` | Popula o banco com os dados de exemplo |
| `npm run db:studio` | Abre o Prisma Studio (explorar o banco visualmente) |

---

## Deploy em produção

O projeto não tem nenhuma dependência de infraestrutura proprietária —
qualquer host que rode Node.js e permita conectar a um Postgres funciona.

### Vercel (recomendado para o front-end/Next.js)
1. Importe o repositório na Vercel.
2. Configure as variáveis de ambiente (`DATABASE_URL`, `NEXTAUTH_URL`,
   `NEXTAUTH_SECRET`).
3. Configure o **Build Command** como `npm run build` (já roda `prisma generate`).
4. Rode as migrations contra o banco de produção uma vez, a partir da sua
   máquina ou de um passo de CI: `npx prisma migrate deploy`.

> **Sobre uploads de arquivo:** o MVP salva capas de curso e PDFs de
> apresentação em `public/uploads`, no próprio sistema de arquivos do
> servidor. Isso funciona bem em hosts com disco persistente (Railway,
> Render, um VPS próprio), mas **não** em plataformas serverless com sistema
> de arquivos efêmero (a Vercel, por exemplo, não persiste `public/uploads`
> entre deploys/instâncias). Se for hospedar na Vercel, troque a
> implementação de `app/api/uploads/route.ts` por upload para um bucket de
> objetos (S3, Cloudflare R2, Vercel Blob etc.) — a interface da rota (recebe
> um arquivo, devolve `{ url }`) foi pensada para que essa troca não exija
> mudanças em nenhum outro arquivo do projeto.

### Railway / Render / VPS próprio
Ambos oferecem Postgres gerenciado + deploy de uma aplicação Node.js com
disco persistente, o que evita a ressalva acima sobre uploads. Fluxo típico:
1. Provisionar um serviço Postgres e copiar a `DATABASE_URL`.
2. Provisionar um serviço Node a partir do repositório, com
   `npm install && npm run build` como build e `npm run start` como start.
3. Definir as variáveis de ambiente.
4. Rodar `npx prisma migrate deploy` uma vez (manualmente ou como *release
   command*, se a plataforma oferecer esse recurso).

### AWS / infraestrutura própria
Qualquer ambiente com Node 20+, acesso de rede ao Postgres e (idealmente)
disco persistente para `public/uploads` funciona sem adaptação — containerize
com um Dockerfile padrão de Next.js (`next build` + `next start`).

---

## Segurança — o que já está implementado

- Senhas com hash **bcrypt** (custo 12), nunca armazenadas em texto puro.
- Sessão via JWT assinado (Auth.js), expiração de 8 horas.
- Autorização em **três camadas**: middleware (rota) → `requireUser`/`requireAdmin`
  em toda Server Action e Route Handler → filtro por `userId` nas queries.
  O front-end nunca é a única barreira.
- Primeiro acesso com **senha padrão** (`Idx@2026`, em `lib/auth/default-password.ts`)
  e troca obrigatória: enquanto `User.mustChangePassword` for `true`, o middleware
  redireciona qualquer rota para `/trocar-senha`. A nova senha não pode ser igual
  à padrão nem à anterior, e a sessão é encerrada após a troca para que o JWT
  seja reemitido sem a flag.
- A troca de senha exige a senha atual, inclusive no primeiro acesso — uma
  sessão herdada não basta para assumir a conta.
- Não há recuperação de senha por e-mail: quem esquece a senha pede ao
  administrador, que redefine a conta para a senha padrão (ação registrada em
  auditoria como `USER_PASSWORD_RESET`).
- Markdown das aulas sanitizado no servidor (`rehype-sanitize`) antes de
  renderizar — mitiga XSS mesmo que o conteúdo cole HTML malicioso.
- Toda escrita no banco passa por Zod no limite da Server Action — nunca
  confia apenas na validação do formulário.
- Consultas parametrizadas via Prisma (proteção contra SQL Injection).
- Log de auditoria (`AuditLog`) para criação/edição/desativação de usuários,
  criação/edição/arquivamento/exclusão de cursos e atribuições.
- Upload de arquivos: allowlist de MIME type e limite de tamanho por tipo,
  restrito a administradores.

**Ainda não implementado (ver "Preparado para o futuro" abaixo):** rate
limiting de tentativas de login. Para produção, recomenda-se adicionar um
limitador (ex.: `@upstash/ratelimit` ou equivalente do seu provedor) na rota
`app/api/auth/[...nextauth]/route.ts`.

---

## Preparado para o futuro

O schema e a arquitetura foram desenhados para não travar as expansões
previstas, sem implementá-las prematuramente:

- **Certificados**: `CourseAssignment.completedAt` já registra a conclusão;
  basta adicionar geração de PDF a partir desse evento.
- **Questionários/avaliações/notas**: adicionar um novo `LessonContentType`
  e uma tabela de respostas, seguindo o mesmo padrão de `LessonContent`.
- **Gamificação/pontos/badges**: nova tabela relacionada a `User`, sem
  alterar o fluxo de progresso existente.
- **Prazo para conclusão / cursos obrigatórios**: campos adicionais em
  `Course`/`CourseAssignment`.
- **Notificações por e-mail**: hoje as notificações são apenas in-app
  (`Notification`); basta introduzir um adaptador de envio e consumi-lo nos
  services, sem tocar no restante do código.
- **SSO / Microsoft Entra ID / LDAP**: Auth.js suporta providers OAuth/SAML
  nativamente; adicionar um novo provider em `auth.ts` não exige reescrever
  o restante da autenticação.
- **Relatórios exportáveis**: os services (`lib/services/`) já retornam os
  dados agregados necessários; adicionar exportação CSV/XLSX é uma camada
  fina sobre eles.
- **SCORM / integrações externas**: `LessonContentType` foi modelado como
  enum extensível justamente para comportar um novo tipo de conteúdo no
  futuro sem migrar a estrutura existente.

---

## Decisões técnicas de destaque

- **Server Actions em vez de uma API REST separada** — reduz boilerplate;
  se no futuro for necessário expor uma API pública (app mobile nativo,
  integrações externas), a lógica já está isolada em `lib/services/` e pode
  ser reexposta via `app/api/` sem duplicar regra de negócio.
- **Apresentações em PDF** (não conversão automática de PPTX) — evita uma
  dependência de conversão pesada e frágil (LibreOffice headless ou serviço
  externo) na primeira versão. `LessonContent.type` já é um enum, então um
  pipeline de conversão de PPTX pode ser adicionado depois sem migrar o
  schema.
- **Reordenação por botões (↑/↓) em vez de drag-and-drop** — mesmo resultado
  para o administrador, com menos código e acessível por teclado por padrão.
  Trocar por drag-and-drop depois é uma mudança isolada em
  `components/admin/course-builder.tsx`.
- **Tipografia self-hosted via `@fontsource`** (não Google Fonts via CDN) —
  a aplicação não depende de nenhum serviço externo para renderizar
  corretamente, o que também simplifica ambientes com política de rede restrita.

---

## Contas de exemplo (após rodar o seed)

| Papel | E-mail | Senha |
|---|---|---|
| Administrador | admin@empresa.local | Admin@123 |
| Colaboradora | ana.souza@empresa.local | Colaborador@123 |
| Colaborador | carlos.lima@empresa.local | Colaborador@123 |
