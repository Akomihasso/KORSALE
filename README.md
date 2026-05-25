# KORSALE

**Kordinat Satış & Operasyon Yönetim Sistemi**

Marka/patent vekilliği şirketi Kordinat için satış funnel'i ve görev devir akışını yöneten web tabanlı PWA. Görüşme → Teklif → Sözleşme → Operasyon zincirini sistematik takip eder; çalışan başına müşteri kazanımı, satış kapatma ve operasyon performansını ayrı ayrı raporlar.

Tam spesifikasyon: [`KORSALE_SPEC.md`](./KORSALE_SPEC.md)

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind v4** + **shadcn/ui** (base-ui preset)
- **Prisma 6** + **PostgreSQL** (Supabase EU bağlanır, lokalde Docker)
- **NextAuth v5** (Credentials provider, JWT)
- **React Hook Form** + **Zod** validasyon
- **Recharts**, **TanStack Table**, **date-fns** (tr locale)

## Kurulum

Detaylı adımlar: [`KURULUM.md`](./KURULUM.md)

```bash
npm install
cp .env.example .env       # değerleri doldur
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

http://localhost:3000

Seed yönetici hesabı: `yonetici@kordinat.com` / `KorsaleDev2026!`

## Sprint durumu

- ✅ **Sprint 1** — Kurulum, Auth, layout, Kullanıcı CRUD, seed
- ✅ **Sprint 2** — Firma + Görüşme CRUD (liste, detay, kişiler, görüşme akışı)
- 📋 Sprint 3 — Teklif + Devir sistemi
- 📋 Sprint 4 — Operasyon
- 📋 Sprint 5 — Funnel + Dashboard + Raporlar
- 📋 Sprint 6 — Dokümantasyon + PWA
- 📋 Sprint 7 — MARKSOFT entegrasyonu

## Komutlar

| Komut | İşlev |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run db:migrate` | Prisma migration |
| `npm run db:studio` | DB GUI |
| `npm run db:seed` | Demo veri yükle |
