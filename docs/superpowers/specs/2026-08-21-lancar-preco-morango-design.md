# Formulário de lançamento diário do preço do morango — Design

**Data:** 2026-08-21
**Status:** aprovado, pronto para plano de implementação

## Contexto

O Ceasinha do Morango (Bom Repouso/MG) registra hoje o preço de referência da caixa de
morango como texto livre no WhatsApp. Esta etapa substitui isso por um formulário interno
de entrada estruturada, dentro do mesmo app Next.js que vai hospedar o dashboard do
CPAM Conecta. O repositório está vazio — este trabalho também estabelece a base do projeto
(scaffold, auth, shell de dashboard).

## Escopo desta etapa

**Dentro do escopo:**
- Scaffold do projeto Next.js (App Router, TypeScript, Tailwind v4, shadcn/ui).
- Shell de dashboard com navegação (preparado para futuras features, hoje com 1 item de menu).
- Autenticação (Supabase Auth, usuário/senha, sem cadastro público) com dois papéis:
  `admin` e `operador`.
- Rota protegida `/admin/lancar-preco`: lista dos últimos 15 dias (segunda–sábado) com
  status de lançamento, + formulário de entrada/edição do dia selecionado.
- Migration SQL da tabela `precos_morango` (schema já definido) + tabela de papéis (`profiles`).
- Testes (Vitest) para validação e lógica de status.

**Fora do escopo (explicitamente adiado):**
- Deploy na Vercel — trabalho fica local (`npm run dev`) por enquanto.
- Diferenciação de permissão entre `admin` e `operador` — infra de papéis existe, mas
  hoje os dois têm acesso idêntico a `/admin/lancar-preco`.
- Criação do projeto Supabase e execução das migrations — o usuário faz isso manualmente;
  este trabalho entrega o SQL e o código esperando as env vars.
- Qualquer outra página do dashboard além de `/admin/lancar-preco`.

## Convenções do projeto (já fixadas, não abertas a esta spec)

- Todo código de implementação passa pelo workflow `superpowers` (esta spec → plano via
  `writing-plans` → execução com TDD). Nunca escrever código direto de uma spec.
- Toda decisão de UI/UX (layout, componentes, cópia, hierarquia visual, estados) é feita
  pela skill `impeccable` durante a implementação — esta spec define **o que** precisa
  existir funcionalmente, nunca **como** aparece na tela.
- Git: branches `main` (produção) e `dev` (desenvolvimento). Trabalho solo, sem PR — commit
  e push direto em `dev`. `main` só é atualizada quando pedido explicitamente.
- Interface em pt-BR, código (nomes de arquivo, variáveis, funções, comentários) em en-US.
  Exceção: o schema do banco (`precos_morango`, `categoria`, `preco_min`, `preco_max`, os
  4 valores de categoria) fica em pt-BR porque corresponde a um histórico já reconstruído
  com essa nomenclatura.
- Gerenciador de pacotes: npm.

## Arquitetura

Abordagem: **Server Components + Server Actions** (Next.js App Router). A página busca os
dados no servidor (usando a sessão do usuário) e os envia já prontos na primeira resposta
HTML — importante para uso no celular com conexão possivelmente ruim. O salvamento é uma
Server Action com validação centralizada em um único lugar (sem API routes separadas).

Estrutura de arquivos prevista (nomes indicativos, podem ajustar levemente na
implementação):

```
src/
  app/
    login/page.tsx                  # form de login (Server Action)
    admin/
      layout.tsx                    # shell: nav + botão logout
      page.tsx                      # redirect -> /admin/lancar-preco
      lancar-preco/
        page.tsx                    # server component: lista de dias + lê ?data=
        strawberry-price-form.tsx   # client component: formulário do dia selecionado
        recent-days-list.tsx        # client/server component: lista dos últimos 15 dias
        actions.ts                  # Server Actions: validar + upsert
  lib/
    supabase/
      client.ts                     # browser client
      server.ts                     # server client (cookies, App Router)
    validation/
      strawberry-price.ts           # schema Zod
  middleware.ts                     # protege /admin/**, redireciona -> /login
supabase/
  migrations/
    0001_create_precos_morango.sql
.env.local.example
```

## Autenticação e autorização

- Sem cadastro público: os dois usuários (funcionária + dono) são criados manualmente pelo
  dono no painel do Supabase (Auth → Users), com email/senha.
- `/login`: email + senha, Server Action chamando `supabase.auth.signInWithPassword`. Erro
  de credencial mostra mensagem inline (texto exato definido via `impeccable`/`clarify`).
  Sucesso redireciona para `/admin`, que redireciona para `/admin/lancar-preco`.
- `middleware.ts`: protege `/admin/**` via `@supabase/ssr`; sem sessão válida, redireciona
  para `/login`. Cobre também refresh de sessão.
- Logout: ação no shell do dashboard, chama `supabase.auth.signOut()` e redireciona para
  `/login`.
- Papéis: tabela `profiles` (`id` referenciando `auth.users`, `role` enum `admin`/`operador`,
  default `operador`), populada automaticamente por trigger quando um usuário é criado no
  Supabase Auth. O dono promove a própria conta para `admin` manualmente via SQL depois de
  se cadastrar. Nesta etapa, RLS de `precos_morango` libera select/insert/update para
  qualquer usuário autenticado com profile, **sem diferenciar pelo `role`** — a coluna existe
  para permitir diferenciação em features futuras sem migration adicional.

## Schema do banco

Tabela `precos_morango` conforme já definido pelo usuário:

```sql
create table precos_morango (
  id bigint generated always as identity primary key,
  data date not null,
  categoria text not null check (categoria in (
    'Velho', 'Bom', 'Safra Nova Top', 'Safra Nova Diferenciado'
  )),
  preco_min numeric not null check (preco_min >= 0),
  preco_max numeric not null check (preco_max >= preco_min),
  lancado_por uuid references auth.users(id),
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now(),
  unique (data, categoria)
);
```

Adição necessária para os papéis:

```sql
create type user_role as enum ('admin', 'operador');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'operador',
  criado_em timestamptz not null default now()
);

create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

RLS:

```sql
alter table precos_morango enable row level security;
alter table profiles enable row level security;

create policy "authenticated users can read precos"
  on precos_morango for select to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid()));

create policy "authenticated users can insert precos"
  on precos_morango for insert to authenticated
  with check (exists (select 1 from profiles where profiles.id = auth.uid()));

create policy "authenticated users can update precos"
  on precos_morango for update to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid()));

create policy "users can read own profile"
  on profiles for select to authenticated
  using (id = auth.uid());
```

(A migration final será revisada com a skill `supabase-postgres-best-practices` durante a
implementação antes de ser entregue ao usuário para rodar.)

## Fluxo de dados

1. **Carregar `/admin/lancar-preco`** (sem `?data=`): server component usa a data de hoje.
   Busca em `precos_morango` os registros dos últimos 15 dias corridos, segunda a sábado
   (domingo excluído da janela), para montar a lista de status. Busca também os registros
   da data selecionada (hoje, por padrão) para pré-preencher o formulário.
2. **Selecionar um dia na lista**: navega para `/admin/lancar-preco?data=YYYY-MM-DD`,
   recarregando o formulário (mesmo servidor, nova data) com os valores daquele dia, se
   existirem.
3. **Editar data manualmente**: o campo de data no formulário também aceita edição direta
   (não só clique na lista), fazendo a mesma navegação por query string.
4. **Preencher categorias**: até 4 blocos (Velho, Bom, Safra Nova Top, Safra Nova
   Diferenciado), cada um com min/max opcionais. Categoria com lançamento existente vem
   pré-preenchida (edição/correção); categoria sem lançamento vem vazia (novo lançamento).
5. **Salvar**: Server Action processa apenas categorias com pelo menos um campo preenchido.
   Validação (ver seção seguinte). Se válido: `upsert` em `precos_morango` com
   `onConflict: 'data,categoria'`, incluindo `lancado_por = auth.uid()`.
6. **Confirmação**: a Server Action retorna o que foi gravado (categoria, min, max, se era
   criação ou atualização). A tela precisa comunicar isso de forma explícita e visível —
   sem redirect silencioso. O formulário permanece na tela após salvar.

### Status "lançado" / "sem lançamento" (lista dos 15 dias)

Um dia conta como **lançado** se existe pelo menos um registro de qualquer categoria
naquela data; caso contrário, **sem lançamento**. Não existe estado "parcial".

## Validação e tratamento de erro (requisitos funcionais)

- Por categoria: min e max devem vir juntos (os dois preenchidos ou os dois vazios) —
  um sozinho é erro.
- `preco_min >= 0`.
- `preco_max >= preco_min`.
- Pelo menos uma categoria precisa estar preenchida para permitir salvar.
- Estados que a UI precisa cobrir (design visual definido via `impeccable` na
  implementação, não aqui): erro de validação por categoria; erro de rede/Supabase ao
  salvar (sem perder o que foi digitado); sessão expirada durante o submit (força
  novo login).
- Toda mensagem visível ao usuário é em pt-BR; a redação exata é decidida na implementação.

## Testes

- **Vitest** para lógica pura: schema Zod (todas as combinações de min/max/vazio) e a
  função que calcula o status lançado/sem-lançamento a partir dos registros de um dia.
- Server Actions/queries Supabase testadas com client mockado (sem banco real): verificar
  que o upsert monta `onConflict`/payload corretos e que a Server Action retorna o formato
  esperado de confirmação/erro.
- Sem E2E nesta etapa.

## Assunções registradas

- "Últimos 15 dias" conta dias corridos a partir de hoje, excluindo domingos da janela e
  da lista (o local não abre aos domingos).
- A home do dashboard (`/admin`) redireciona direto para `/admin/lancar-preco`, sem tela
  intermediária, já que é a única feature hoje.
