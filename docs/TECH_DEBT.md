# Teknik borç kaydı

Bilinçli olarak eklenen geçici kod, kapatılmış test, bilinçli kısayol, tek seferlik admin endpoint. Silme/temizlik Zarko'nun açık kararıyla yapılır.

| # | Ne (dosya yolu) | Eklenme | Neden geçici | Risk | Silinme tarihi | Durum |
|---|---|---|---|---|---|---|
| 1 | `src/components/dokuman-yukle-dialog.tsx:39` — `// eslint-disable-next-line react-hooks/set-state-in-effect` | 2026-10-27 | React 19 lint kuralı useEffect içinde setState kullanımına uyarı veriyor; pre-commit kapısı engelliyordu. Pattern meşru (useActionState sonucuyla dialog kapat). | Bakım: React/Next.js güncellemelerinde kural değişebilir. Davranış riski yok. | — (kural değişince gözden geçir) | AKTİF |
| 2 | `src/components/route-progress.tsx:96` — Aynı eslint-disable | 2026-10-27 | Pathname değişince progress state'ini sıfırlama — meşru effect. | Aynı | — | AKTİF |
| 3 | 59 npm güvenlik açığı (fresh clone sonrası `npm install`) | 2026-10-27 | Zaman kısıtı: UI paketleri öncelikliydi. | 5 critical + 21 high — detay incelenmedi. Hangi paketlerin hassas endpoint'lere yakın olduğu bilinmiyor. | 2026-11-15'e kadar `npm audit fix` + manuel inceleme | AÇIK |
| 4 | Dashboard "Dönem seçicisi (Bu ay/Bu hafta/Tümü)" — Zarko'ya söylenmedi | 2026-10-27 | Zarko sorumda "sabit Bu ay kalsın (1b)" dedi, oysa kodda zaten HAFTA/AY/TUMU sekmeleri mevcuttu. Kodu değiştirmedim ama Zarko'ya seçicinin varlığını bildirmedim. | Düşük. Kullanıcı deneyimi — Zarko fark ederse açıklanır. | Sonraki oturumda Zarko'ya göster | AKTİF |
| 5 | Teklif → Operasyon **manuel** aktarma yolu doğrulanmadı | 2026-10-27 | Para alınınca otomatik operasyon açılıyor (`teklif-actions.ts:369+`). Zarko "güvendiğimiz müşteriler için manuel operasyon açılabilsin" demişti; "zaten vardır" dedi — ama kod doğrulanmadı. | Orta. Yoksa yeni bir action yazmak gerek (Paket D kapsamında olabilir). | Paket D başında doğrulanacak | AKTİF |
| 6 | Repo PUBLIC (göç öncesi haliyle) | 2026-10-27 (bu oturumda değişmedi) | Coolify Source bağlantı tipi doğrulanmadan Private'a geçmek deploy'u kırabilir. | Yüksek: kod + env örnekleri + bağımlılık listesi herkese açık. | Coolify 3 bilgi geldiğinde Private | AÇIK |
| 7 | Main branch 20+ gün geride | 2026-09-22'den beri | Hetzner cutover sonrası main güncellenmedi; prod `chore/hetzner-migration`'dan deploy ediliyor. | Orta. Yeni geliştirici "main"den klonlarsa eski kod alır. | Faz A merge'de kapanır | AÇIK |
| 8 | `src/app/(app)/teklifler/[id]/page.tsx:11` — `ClipboardList` unused import | Bilinmiyor (önceki commit'lerden kaldı) | Lint warning, 0 error. Benim değişikliğim değil. | Yok. | Fırsat olunca temizle | DÜŞÜK |
