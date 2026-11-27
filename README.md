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
- **Bot nazorati**: tokenni qo'yib, mijoz botini bir tugma bilan ulash; holat monitoringi, /start matni va tavsiflarni tahrirlash, yangi buyurtmalar haqida adminga xabar, barcha mijozlarga e'lon yuborish
- Sozlamalar: tizim holati tekshiruvi

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
   - `schema.sql` ni oldinroq ishga tushirgan bo'lsangiz, `supabase/migrations/002_app_settings.sql` ni ham bir marta **Run** qiling
3. **Project Settings → API** dan oling: `Project URL` va `service_role` kaliti

### 2. Telegram bot
Bot tokeni `.env` ga yozilmaydi — u keyinroq admin saytdagi **Bot nazorati** bo'limida kiritiladi (4-qadam).

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
| `ALLOW_DEV_USER` | `false` |

6. **Deploys → Trigger deploy → Deploy site** — env bilan qayta yig'iladi

> 💡 Sayt nomini **Site configuration → Change site name** orqali o'zgartirish mumkin (masalan `xizmatchi` → `xizmatchi.netlify.app`). Nomni o'zgartirsangiz, **Bot nazorati → Qayta sozlash** tugmasini bosing.
>
> 💡 Har safar GitHub'ga yangi kod push qilinganda Netlify o'zi avtomatik qayta deploy qiladi.

### 4. Botni ulash (admin saytdan)
1. Telegramda [@BotFather](https://t.me/BotFather) → `/newbot` → bot nomi va username (`..._bot`) → **tokenni nusxalang**
2. Saytni **https** manzil orqali oching → `/login` → admin bilan kiring
3. **Bot nazorati** → tokenni qo'ying → **Botni ulash**

Avtomatik o'rnatiladi: webhook, chatdagi **"Usta topish"** menyu tugmasi, `/start` va `/id` buyruqlari, bot tavsifi.
Shu bo'limda keyin: holatni kuzatish, matnlarni tahrirlash, admin xabarnomalari, barcha mijozlarga e'lon yuborish.

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
