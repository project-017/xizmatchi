-- ═══════════════════════════════════════════════════════════════
--  002: Tizim sozlamalari (bot tokeni va boshqalar admin saytdan boshqariladi)
--  Agar schema.sql ni oldin ishga tushirgan bo'lsangiz — shu faylni ham
--  Supabase → SQL Editor da bir marta RUN qiling.
-- ═══════════════════════════════════════════════════════════════
create table if not exists app_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);
alter table app_settings enable row level security;
