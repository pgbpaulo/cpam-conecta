# CPAM Conecta

Painel interno do Ceasinha do Morango (Bom Repouso/MG) para lançar o preço
diário da caixa de morango por categoria. Next.js (App Router) + Supabase.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). A rota raiz redireciona
para `/admin/lancar-preco`.

Outros comandos úteis:

```bash
npm run test    # roda a suíte de testes (Vitest)
npm run build   # build de produção
npm run lint    # lint (ESLint)
```

## Configuração do Supabase (manual, feita uma vez)

Este projeto usa Supabase para autenticação e banco de dados (Postgres). Não
há automação de provisionamento — os passos abaixo são feitos manualmente no
painel do Supabase.

1. **Crie um projeto no Supabase** em [supabase.com](https://supabase.com).
2. **Rode a migração**: abra o SQL Editor do projeto e execute o conteúdo de
   `supabase/migrations/0001_create_precos_morango.sql`. Isso cria a tabela
   `precos_morango`, a tabela `profiles`, os triggers e as políticas de RLS.
3. **Crie os usuários de autenticação**: no painel Supabase, em
   Authentication → Users, crie manualmente as contas (e-mail/senha) de quem
   vai usar o sistema (owner e operador). A criação de um usuário dispara o
   trigger `handle_new_user`, que cria automaticamente a linha correspondente
   em `profiles` com `role = 'operador'`.
4. **Promova a conta do owner a admin**: no SQL Editor, rode:
   ```sql
   update profiles set role = 'admin' where id = '<uuid-do-usuário>';
   ```
   (o UUID aparece na lista de usuários em Authentication → Users).
5. **Configure as variáveis de ambiente**: copie `.env.local.example` para
   `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` e
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` com os valores em Project Settings → API
   do painel Supabase.

```bash
cp .env.local.example .env.local
```
