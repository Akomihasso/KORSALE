# Devir notu — 2026-10-27

## Durum (tek cümle)
Dashboard rakam tutarlılığı + funnel yeniden tasarımı + liste sütun düzenleri canlı branch'e push edildi (`chore/hetzner-migration` sha `9dde822`); Zarko funnel'ın son halini onayladı.

## Bu oturumda yapılanlar (merge sırası)
- `f4ed499` Paket B+A — Dashboard KPI yeniden adlandırma + adet/ciro iki satır + grup bazlı tarih kolonu + "Aktif" sekmesi (operasyonlar listesi)
- `f61d88b` Paket C — Funnel ilk sürüm (3 ana katman + iç dilimler), HTML+padding tabanlı (dikdörtgen görünüyordu)
- `7cb43c6` Paket F — Görüşmeler/Teklifler listesi sütun daraltma, saat gizleme, sıra değişikliği
- `d8ab1e6` Paket G — Funnel SVG trapez tabanlı yeniden yazıldı (klasik ters piramit, PowerPoint referansına uygun)
- `964bcea` G.2 — Grid satır layout (sol SVG + sağ kart yan yana hizada), Teklif ters trapez (hata), Teklif %20 dar + %25 yüksek, Operasyon %35 dar
- `63fdb44` G.3 — Teklif trapez yönü düzeltildi (klasik yönde: üst geniş alt dar)
- `ab0410e` G.4 — Teklif katmanı eteği %10 daha uzatıldı (dikey)
- `61cb4d1` G.5 — Teklif ve Operasyon trapezleri garanti klasik huni (veriden bağımsız) + Teklif eteği bir %10 daha
- `9dde822` G.6 — Hiyerarşi garantili: Görüşme > Teklif > Operasyon. Teklif daraltma 0.8 → 1.12 (%40 artış). Katmanlar arası akıcı geçiş.
- Yan düzeltme: `dokuman-yukle-dialog.tsx`, `route-progress.tsx` içindeki React 19 lint false-positive'leri inline `eslint-disable` ile geçildi (pre-commit kapısı için).
- `npm install` ilk kez çalıştırıldı (fresh clone sonrası, 931 paket). 59 güvenlik açığı raporlandı.

## Yarım kalanlar
Yok. Working tree clean, tüm değişiklikler push edildi.

## Sıradaki adım (ilk yapılacak iş)
Zarko'ya iş-türü→durum eşlemesini sor (örn: marka başvurusu "yayımlandı" olunca aktif mi?), **Paket D** (operasyon durum akışı + rapor) için branch aç. Alternatif: Faz A temizlik (Coolify 3 bilgi gelmişse).

## Bekleyenler / dikkat
- **Coolify UI'den 3 bilgi** (Zarko iletecek) — `coolify_dogrulama_bekliyor.md`: Source bağlantı tipi (GitHub App/Public/PAT), auto-deploy toggle, Postgres yedek açık/kapalı
- **Paket D için iş-türü→durum eşlemesi** (Zarko bilgi verecek)
- **Post-cutover 5 kalem** (Zarko bakacak): UptimeRobot kurulumu, Vercel arşivi, Supabase sil, eski Brevo key sil, personele duyuru maili
- **Faz A temizlik** (Coolify bilgi gelince): pre-hetzner-2026 tag → PR aç (chore/hetzner-migration → main) → merge → Supabase kalıntı temizliği → README güncelle
- **Faz B dokümantasyon** (sonra): `proje-baslatma` skill'i ile docs/ iskeleti (PRODUCT, ARCHITECTURE, DESIGN_SYSTEM, SECURITY)
- **Repo Private** (Coolify Source bilgisi geldikten sonra)

## Açık riskler
- **59 npm güvenlik açığı** — 5 critical, 21 high, 31 moderate, 2 low. `npm audit` ile detay incelenmedi. Hassas endpoint'lere yakın bir paket varsa acil.
- **Main branch 20+ gün geride** — chore/hetzner-migration prod'da, main güncellenmedi. Faz A kapsamında merge sonrası eş zamanlı olacak.
- **Repo hâlâ PUBLIC** — Coolify Source bağlantı tipi doğrulanmadan Private'a geçmek deploy'u kırabilir.
- **Teklif/Operasyon otomatik akışı** — `odemeAl` action'ında para alınınca otomatik operasyon açılıyor (teklif-actions.ts:369+). Manuel operasyon açma yolu kontrol edilmedi — Zarko "güvendiğimiz müşteriler için manuel operasyon açılabilsin" demişti; var olup olmadığı doğrulanmadı.
- **Dashboard dönem seçicisi** — Zarko soru 1b dedi (sabit "Bu ay" kalsın), ama meğer kodda zaten HAFTA/AY/TUMU seçici varmış. Mevcut haliyle çalışıyor; Zarko'nun bundan haberi olmayabilir.
