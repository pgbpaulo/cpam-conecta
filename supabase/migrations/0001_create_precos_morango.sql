-- supabase/migrations/0001_create_precos_morango.sql

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

-- Index the FK column: Postgres does not auto-index foreign keys,
-- and this speeds up joins/filters on who launched a price entry.
create index precos_morango_lancado_por_idx on precos_morango (lancado_por);

create function set_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger precos_morango_set_atualizado_em
  before update on precos_morango
  for each row execute function set_atualizado_em();

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

alter table precos_morango enable row level security;
alter table profiles enable row level security;

-- auth.uid() is wrapped in (select ...) so Postgres evaluates it once per
-- statement and caches it, instead of once per row (5-10x faster on RLS
-- policies per Supabase's RLS performance guidance).
create policy "authenticated users can read precos"
  on precos_morango for select to authenticated
  using (exists (select 1 from profiles where profiles.id = (select auth.uid())));

create policy "authenticated users can insert precos"
  on precos_morango for insert to authenticated
  with check (exists (select 1 from profiles where profiles.id = (select auth.uid())));

create policy "authenticated users can update precos"
  on precos_morango for update to authenticated
  using (exists (select 1 from profiles where profiles.id = (select auth.uid())));

create policy "users can read own profile"
  on profiles for select to authenticated
  using (id = (select auth.uid()));
