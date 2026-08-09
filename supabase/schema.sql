-- =========================================================
-- SCHEMA: App de Nutrición y Macros
-- Fase 0 — Fundación
-- =========================================================
-- Convención: todas las tablas tienen RLS activado desde el
-- día uno. Ningún dato es accesible sin política explícita.
-- =========================================================

-- ---------------------------------------------------------
-- 1. PROFILES
-- Extiende auth.users con datos del perfil nutricional.
-- ---------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  age integer check (age > 0 and age < 120),
  sex text check (sex in ('male', 'female')),
  weight_kg numeric(5,2) check (weight_kg > 0),
  height_cm numeric(5,2) check (height_cm > 0),
  activity_level text check (
    activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')
  ),
  goal text check (goal in ('lose_fat', 'maintain', 'gain_muscle')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No delete policy: el borrado de perfil se maneja vía
-- cascade cuando se elimina el usuario de auth.users.

-- ---------------------------------------------------------
-- 2. MACRO GOALS
-- Objetivos diarios de calorías/macros. Se recalculan al
-- editar el perfil, pero el usuario puede sobreescribirlos
-- manualmente (is_custom = true evita que se pisen).
-- ---------------------------------------------------------
create table public.macro_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  calories integer not null check (calories > 0),
  protein_g integer not null check (protein_g >= 0),
  carbs_g integer not null check (carbs_g >= 0),
  fat_g integer not null check (fat_g >= 0),
  is_custom boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.macro_goals enable row level security;

create policy "Users can view their own goals"
  on public.macro_goals for select
  using (auth.uid() = user_id);

create policy "Users can insert their own goals"
  on public.macro_goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own goals"
  on public.macro_goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------
-- 3. MEALS
-- Agrupa alimentos por tipo de comida y día.
-- ---------------------------------------------------------
create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  logged_date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.meals enable row level security;

create policy "Users can view their own meals"
  on public.meals for select
  using (auth.uid() = user_id);

create policy "Users can insert their own meals"
  on public.meals for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own meals"
  on public.meals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own meals"
  on public.meals for delete
  using (auth.uid() = user_id);

create index meals_user_date_idx on public.meals (user_id, logged_date);

-- ---------------------------------------------------------
-- 4. FOOD ENTRIES
-- Alimentos individuales dentro de una comida. El timestamp
-- (logged_at) es lo que alimenta el gráfico tipo "trading".
-- ---------------------------------------------------------
create table public.food_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_id uuid not null references public.meals(id) on delete cascade,
  name text not null,
  quantity numeric(8,2) not null check (quantity > 0),
  unit text not null,
  calories numeric(8,2) not null check (calories >= 0),
  protein_g numeric(8,2) not null check (protein_g >= 0),
  carbs_g numeric(8,2) not null check (carbs_g >= 0),
  fat_g numeric(8,2) not null check (fat_g >= 0),
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.food_entries enable row level security;

create policy "Users can view their own food entries"
  on public.food_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert their own food entries"
  on public.food_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own food entries"
  on public.food_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own food entries"
  on public.food_entries for delete
  using (auth.uid() = user_id);

create index food_entries_user_logged_at_idx on public.food_entries (user_id, logged_at);
create index food_entries_meal_idx on public.food_entries (meal_id);

-- ---------------------------------------------------------
-- 5. AI CHATS
-- Conversaciones del asistente de IA.
-- ---------------------------------------------------------
create table public.ai_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Nueva conversación',
  provider text not null default 'claude' check (provider in ('claude', 'openai', 'gemini', 'grok')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_chats enable row level security;

create policy "Users can view their own chats"
  on public.ai_chats for select
  using (auth.uid() = user_id);

create policy "Users can insert their own chats"
  on public.ai_chats for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own chats"
  on public.ai_chats for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own chats"
  on public.ai_chats for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------
-- 6. AI MESSAGES
-- Mensajes dentro de cada chat. El rol 'assistant' se
-- inserta únicamente desde el backend (service role), nunca
-- desde el cliente — por eso no hay policy de insert para
-- assistant en el frontend; se controla a nivel de aplicación.
-- ---------------------------------------------------------
create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.ai_chats(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.ai_messages enable row level security;

create policy "Users can view messages from their own chats"
  on public.ai_messages for select
  using (auth.uid() = user_id);

-- Insert de mensajes 'user' vía frontend (con service validando
-- user_id server-side). Insert de mensajes 'assistant' se hace
-- con la service_role key desde el backend, que bypassea RLS
-- por diseño de Supabase — por eso no necesita policy aparte,
-- pero SIEMPRE debe validarse el chat_id/user_id en el backend
-- antes de insertar.
create policy "Users can insert user messages in their own chats"
  on public.ai_messages for insert
  with check (auth.uid() = user_id and role = 'user');

create index ai_messages_chat_idx on public.ai_messages (chat_id, created_at);

-- ---------------------------------------------------------
-- 7. TRIGGER: updated_at automático
-- ---------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_updated_at_macro_goals
  before update on public.macro_goals
  for each row execute function public.set_updated_at();

create trigger set_updated_at_food_entries
  before update on public.food_entries
  for each row execute function public.set_updated_at();

create trigger set_updated_at_ai_chats
  before update on public.ai_chats
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------
-- 8. TRIGGER: crear perfil automáticamente al registrarse
-- ---------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
