# KORSALE — Geliştirici Kurulum Rehberi

## Önkoşullar

- Node.js ≥ 20 (geliştirme makinende: **24.15** ✓)
- npm ≥ 10
- Git

## 1. İlk Açılış

```bash
cd korsale
npm install
```

## 2. Veritabanı — Supabase (Frankfurt EU)

KVKK + vekillik gizliliği için **Frankfurt (eu-central-1)** region zorunlu.

### 2.1 Supabase projesi oluştur

1. https://supabase.com/dashboard adresine git
2. **New project**
   - Name: `korsale-prod` (veya `korsale-dev`)
   - DB password: güçlü bir parola üret, kaydet
   - Region: **Central EU (Frankfurt)** ← önemli
   - Pricing: Free plan başlangıç için yeterli
3. Proje hazır olduğunda **Project Settings → Database** menüsünden:
   - **Connection string → Transaction pooler (port 6543)** kopyala → `DATABASE_URL`
   - **Connection string → Session mode (port 5432)** kopyala → `DIRECT_URL`
   - Şifre kısmındaki `[YOUR-PASSWORD]`'ü gerçek şifre ile değiştir

### 2.2 .env doldur

`.env` dosyasını aç, `.env.example`'daki formatı takip ederek Supabase'ten aldığın değerleri yaz:

```bash
DATABASE_URL="postgresql://postgres.xxx:PASS@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.xxx:PASS@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
```

### 2.3 AUTH_SECRET üret

PowerShell:

```powershell
[Convert]::ToBase64String((1..32 | %{ Get-Random -Maximum 256 }))
```

veya Bash:

```bash
openssl rand -base64 32
```

Çıkan değeri `.env` içindeki `AUTH_SECRET`'a yapıştır.

## 3. Migration ve Seed

```bash
# Şemayı Supabase'e uygula
npx prisma migrate dev --name init

# (opsiyonel) ilk verileri yükle
npm run db:seed
```

İlk migration başarılı olursa `prisma/migrations/` altında bir klasör oluşur.

## 4. Geliştirme Sunucusu

```bash
npm run dev
```

http://localhost:3000 → giriş ekranı (seed'lenmiş yönetici hesabı ile gir).

## 5. Faydalı Komutlar

| Komut | İşlev |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim build |
| `npx prisma studio` | Veritabanı GUI |
| `npx prisma migrate dev --name <isim>` | Yeni migration |
| `npx prisma generate` | Client yeniden üret |
| `npm run db:seed` | Seed verisi yükle |

## 6. Notlar

- **Tailwind v4 + shadcn (base preset)** — bileşenler `@base-ui/react` üstüne kurulu, radix değil
- **Prisma 6** — Prisma 7'nin yeni adapter modeli henüz `@auth/prisma-adapter` ile uyumsuz
- **Next.js 16 + React 19** — App Router, Turbopack default
- **`next-pwa` atlandı** — Next 16 desteği yok; Sprint 6'da Serwist veya `@ducanh2912/next-pwa` denenecek
- **OneDrive klasörü uyarısı** — `node_modules` OneDrive sync ile çakışırsa projeyi `C:\dev\korsale` gibi sync dışı bir yere taşı
