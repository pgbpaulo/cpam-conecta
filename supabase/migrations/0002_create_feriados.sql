-- supabase/migrations/0002_create_feriados.sql

create table feriados (
  data date primary key,
  marcado_por uuid references auth.users(id),
  criado_em timestamptz not null default now()
);

alter table feriados enable row level security;

create policy "authenticated users can read feriados"
  on feriados for select to authenticated
  using (exists (select 1 from profiles where profiles.id = (select auth.uid())));

create policy "authenticated users can insert feriados"
  on feriados for insert to authenticated
  with check (exists (select 1 from profiles where profiles.id = (select auth.uid())));

create policy "authenticated users can delete feriados"
  on feriados for delete to authenticated
  using (exists (select 1 from profiles where profiles.id = (select auth.uid())));
