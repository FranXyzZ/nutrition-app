-- Tabla para el check-in diario del calendario: marca si ese día
-- el usuario comió bien. Un registro por usuario y día (unique).
--
-- Corré esto en el SQL Editor de tu proyecto de Supabase (o con la
-- CLI: npx supabase db push) — no se aplica solo, el asistente no
-- tiene acceso a tu base de datos real.

create table if not exists public.day_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null,
  ate_well boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);

create index if not exists day_checkins_user_date_idx
  on public.day_checkins (user_id, checkin_date);

alter table public.day_checkins enable row level security;

create policy "Users can view their own checkins"
  on public.day_checkins for select
  using (auth.uid() = user_id);

create policy "Users can insert their own checkins"
  on public.day_checkins for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own checkins"
  on public.day_checkins for update
  using (auth.uid() = user_id);

create policy "Users can delete their own checkins"
  on public.day_checkins for delete
  using (auth.uid() = user_id);

-- Mantiene updated_at al día en cada update, igual que el resto
-- de las tablas del proyecto.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists day_checkins_set_updated_at on public.day_checkins;
create trigger day_checkins_set_updated_at
  before update on public.day_checkins
  for each row execute function public.set_updated_at();
