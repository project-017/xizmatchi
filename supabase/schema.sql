-- ═══════════════════════════════════════════════════════════════
--  XIZMATCHI — ma'lumotlar bazasi sxemasi
--  Supabase → SQL Editor → shu faylni to'liq joylab, RUN bosing.
-- ═══════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── Xizmat turlari (kategoriyalar) ──
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  icon        text not null default '🛠️',
  color       text not null default '#6366f1',
  description text,
  sort        int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── Ustalar (xizmat ko'rsatuvchilar). Profilni faqat admin yaratadi ──
create table if not exists providers (
  id               uuid primary key default gen_random_uuid(),
  login            text not null unique,
  password_hash    text not null,
  full_name        text not null,
  phone            text,
  category_id      uuid references categories(id) on delete set null,
  bio              text,
  experience_years int  not null default 0,
  price_from       int  not null default 0,
  price_unit       text not null default 'xizmat',
  district         text,
  avatar_url       text,
  telegram_chat_id bigint,
  is_active        boolean not null default true,   -- admin bloklashi mumkin
  is_available     boolean not null default true,   -- usta o'zi: "bo'shman / bandman"
  rating           numeric(2,1) not null default 0,
  reviews_count    int not null default 0,
  jobs_done        int not null default 0,
  created_at       timestamptz not null default now()
);
create index if not exists providers_category_idx on providers(category_id);

-- ── Mijozlar (Telegram foydalanuvchilari, avtomatik yaratiladi) ──
create table if not exists clients (
  id           uuid primary key default gen_random_uuid(),
  telegram_id  bigint not null unique,
  first_name   text,
  last_name    text,
  username     text,
  phone        text,
  photo_url    text,
  is_blocked   boolean not null default false,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

-- ── Ustaning bo'sh vaqtlari ──
create table if not exists slots (
  id          uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers(id) on delete cascade,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  is_booked   boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (provider_id, starts_at)
);
create index if not exists slots_provider_time_idx on slots(provider_id, starts_at);

-- ── Buyurtmalar ──
do $$ begin
  create type booking_status as enum ('pending','accepted','on_way','completed','cancelled','rejected');
exception when duplicate_object then null; end $$;

create table if not exists bookings (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients(id) on delete cascade,
  provider_id  uuid not null references providers(id) on delete cascade,
  slot_id      uuid references slots(id) on delete set null,
  scheduled_at timestamptz not null,
  address      text not null,
  phone        text not null,
  note         text,
  status       booking_status not null default 'pending',
  rating       int check (rating between 1 and 5),
  review       text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists bookings_provider_idx on bookings(provider_id, scheduled_at desc);
create index if not exists bookings_client_idx on bookings(client_id, created_at desc);

-- ── updated_at avtomatik ──
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists bookings_updated_at on bookings;
create trigger bookings_updated_at before update on bookings
  for each row execute function set_updated_at();

-- ── Usta reytingi / bajarilgan ishlar sonini avtomatik hisoblash ──
create or replace function refresh_provider_stats() returns trigger language plpgsql as $$
declare pid uuid;
begin
  if tg_op = 'DELETE' then pid := old.provider_id; else pid := new.provider_id; end if;
  update providers p set
    rating        = coalesce((select round(avg(b.rating)::numeric, 1) from bookings b where b.provider_id = pid and b.rating is not null), 0),
    reviews_count = (select count(*) from bookings b where b.provider_id = pid and b.rating is not null),
    jobs_done     = (select count(*) from bookings b where b.provider_id = pid and b.status = 'completed')
  where p.id = pid;
  return null;
end $$;
drop trigger if exists bookings_stats on bookings;
create trigger bookings_stats after insert or update or delete on bookings
  for each row execute function refresh_provider_stats();

-- ── Tizim sozlamalari (bot tokeni va h.k. — admin saytdan boshqariladi) ──
create table if not exists app_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

-- ── Xavfsizlik: RLS yoqiladi, siyosat yo'q → faqat server (service_role) kira oladi ──
alter table categories enable row level security;
alter table providers  enable row level security;
alter table clients    enable row level security;
alter table slots      enable row level security;
alter table bookings   enable row level security;
alter table app_settings enable row level security;

-- ── Boshlang'ich xizmat turlari ──
insert into categories (name, slug, icon, color, sort) values
  ('Santexnik',              'santexnik',     '🚰', '#0ea5e9', 1),
  ('Elektrik',               'elektrik',      '⚡', '#f59e0b', 2),
  ('Konditsioner ustasi',    'konditsioner',  '❄️', '#06b6d4', 3),
  ('Molyar (bo''yoqchi)',    'molyar',        '🎨', '#ec4899', 4),
  ('Beton quyuvchi',         'beton',         '🧱', '#78716c', 5),
  ('Shifer / tom ustasi',    'shifer',        '🏠', '#ef4444', 6),
  ('Kafel ustasi',           'kafel',         '🔲', '#14b8a6', 7),
  ('Gipsokarton',            'gipsokarton',   '📐', '#8b5cf6', 8),
  ('Payvandchi',             'payvandchi',    '🔥', '#f97316', 9),
  ('Duradgor',               'duradgor',      '🪚', '#a16207', 10),
  ('Eshik-deraza ustasi',    'eshik-deraza',  '🚪', '#6366f1', 11),
  ('Maishiy texnika ta''miri','texnika',      '🔧', '#64748b', 12),
  ('Tozalash xizmati',       'tozalash',      '🧹', '#22c55e', 13),
  ('Yuk tashish',            'yuk-tashish',   '🚚', '#3b82f6', 14)
on conflict (slug) do nothing;
