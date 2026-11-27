# 🛠 Xizmatchi — Telegram Mini App

Uyga usta chaqirish tizimi: mijoz Telegram ichida xizmatni tanlaydi, ustaning bo'sh vaqtini ko'radi va band qiladi.

**Stack:** Next.js 15 (Netlify) · Supabase (Postgres) · Tailwind CSS · Telegram WebApp

## 3 ta rol

| Rol | Qayerda | Kirish |
|---|---|---|
| 👑 **Admin** | `/admin` (sayt) | `.env` dagi `ADMIN_LOGIN` / `ADMIN_PASSWORD` |
| 🔧 **Usta** | `/panel` (sayt) | Admin yaratgan login/parol |
| 👤 **Mijoz** | `/app` (Telegram Mini App) | Avtomatik — Telegram akkaunti orqali |

Admin ham, usta ham bitta sahifadan kiradi: **`/login`**. Tizim kim kirganini o'zi aniqlab, kerakli panelga yo'naltiradi.

### Admin nima qila oladi
- Ustalar yaratish (login + parol berish), tahrirlash, bloklash, o'chirish, parolni tiklash
- Xizmat turlari (kategoriyalar) qo'shish/tahrirlash — emoji, rang, tartib
- Barcha buyurtmalarni ko'rish va holatini o'zgartirish
- Mijozlar ro'yxati, bloklash
- Sozlamalar: env tekshiruvi, Telegram botni bir tugma bilan ulash

### Usta nima qila oladi
- Yangi buyurtmalarni ko'rish → **Qabul qilish / Rad etish → Yo'ldaman → Bajarildi**
- Ish jadvali: bir necha kunga birdaniga bo'sh vaqt qo'shish (masalan 09:00–18:00, har 2 soat)
- "Bo'shman / Bandman" tugmasi
- Profil va parolni o'zgartirish
- Telegramga yangi buyurtma xabari (botga `/id` yozib, raqamni profilga kiritadi)

### Mijoz nima qila oladi
- Xizmat turlarini ko'rish, ism bo'yicha qidirish
- Ustalar ro'yxati: reyting, tajriba, narx, eng yaqin bo'sh vaqt; filtrlar (bo'sh / reyting / arzon)
- Usta sahifasi → kun va vaqt tanlash → manzil (GPS bilan) + telefon → band qilish
- "Buyurtmalarim": holatni kuzatish, bekor qilish, ustaga qo'ng'iroq, ishdan keyin baholash ⭐
- Holat o'zgarganda Telegramga xabar keladi

---

## 🚀 O'rnatish (bosqichma-bosqich)

### 1. Supabase
1. [supabase.com](https://supabase.com) → **New project**
2. **SQL Editor** → `supabase/schema.sql` faylining hammasini joylab **Run** bosing (jadvallar + 14 ta xizmat turi yaratiladi)
3. **Project Settings → API** dan oling: `Project URL` va `service_role` kaliti

### 2. Telegram bot
1. [@BotFather](https://t.me/BotFather) → `/newbot` → token oling
2. (Ixtiyoriy) `/newapp` orqali Mini App ham yaratish mumkin — URL: `https://SIZNING-DOMEN/app`

### 3. Netlify
1. [app.netlify.com](https://app.netlify.com) → GitHub bilan kiring
2. **Add new project → Import an existing project → GitHub** → `xizmatchi` repozitoriyni tanlang
3. Build sozlamalari `netlify.toml` dan avtomatik olinadi — hech narsani o'zgartirmang
4. **Deploy** bosing. Birinchi deploy xato bilan tugashi mumkin (env hali yo'q) — bu normal
5. **Site configuration → Environment variables → Add a variable** — quyidagilarni kiriting:

| O'zgaruvchi | Qiymat |
|---|---|
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role kaliti (**maxfiy**) |
| `ADMIN_LOGIN` / `ADMIN_PASSWORD` | Admin login va kuchli parol |
| `AUTH_SECRET` | Uzun tasodifiy satr (`openssl rand -hex 32`) |
| `TELEGRAM_BOT_TOKEN` | BotFather tokeni |
| `TELEGRAM_WEBHOOK_SECRET` | Istalgan so'z (A-Z, 0-9, `_`) |
| `NEXT_PUBLIC_APP_URL` | `https://SAYT-NOMI.netlify.app` (oxirida `/` siz) |
| `ALLOW_DEV_USER` | `false` |

6. **Deploys → Trigger deploy → Deploy site** — env bilan qayta yig'iladi

> 💡 Sayt nomini **Site configuration → Change site name** orqali o'zgartirish mumkin (masalan `xizmatchi` → `xizmatchi.netlify.app`). Nomni o'zgartirsangiz, `NEXT_PUBLIC_APP_URL` ni ham yangilab, qayta deploy qiling.
>
> 💡 Har safar GitHub'ga yangi kod push qilinganda Netlify o'zi avtomatik qayta deploy qiladi.

### 4. Botni ulash
Sayt ochilgach: `/login` → admin bilan kiring → **Sozlamalar → "Botni ulash"**.
Bu webhook'ni, chatdagi **"Usta topish"** menyu tugmasini va `/start`, `/id` buyruqlarini o'rnatadi.

### 5. Birinchi usta
Admin → **Ustalar → + Yangi usta** → ma'lumotlar, login, parol → ustaga login/parolni bering.
Usta `/login` orqali kiradi → **Ish jadvali**dan bo'sh vaqtlarini qo'shadi → mijozlar band qila boshlaydi ✅

---

## 💻 Lokal ishga tushirish

```bash
npm install
cp .env.example .env.local   # qiymatlarni to'ldiring, ALLOW_DEV_USER=true
npm run dev
```
`ALLOW_DEV_USER=true` bo'lsa, mini appni brauzerda (Telegram'siz) `http://localhost:3000/app` da sinash mumkin.

## 📁 Tuzilma

```
app/
  page.tsx              → landing sahifa
  login/                → admin + usta uchun yagona kirish
  admin/                → admin panel (ustalar, kategoriyalar, buyurtmalar, mijozlar, sozlamalar)
  panel/                → usta kabineti (buyurtmalar, jadval, profil)
  app/                  → Telegram Mini App (mijoz)
  api/app/*             → mini app API (initData imzosi tekshiriladi)
  api/telegram/*        → bot webhook va sozlash
lib/                    → supabase, auth (JWT cookie), telegram, formatlash
supabase/schema.sql     → ma'lumotlar bazasi
```

## 🔒 Xavfsizlik
- Barcha jadvallarda RLS yoqilgan; bazaga faqat server `service_role` orqali kiradi — kalit brauzerga chiqmaydi
- Mini app so'rovlari Telegram `initData` HMAC imzosi bilan tekshiriladi
- Parollar bcrypt bilan xeshlanadi; sessiya — imzolangan httpOnly cookie (7 kun)
- Slot band qilish atomik: ikki mijoz bir vaqtni bir paytda band qila olmaydi
