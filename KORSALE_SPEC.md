# KORSALE — Kordinat Satış & Operasyon Yönetim Sistemi
**Versiyon:** 2.0 (Revize)
**Tarih:** Mayıs 2026

## 0. Bu Dokümanın Amacı

Bu MD, **Claude Code** veya benzeri bir AI kod asistanı için yazılmış üretim-hazır bir spesifikasyondur. Hedef: Kordinat İnovasyon ve Fikri Mülkiyet Yönetimi şirketinin görüşme → teklif → sözleşme → operasyon zincirini sistematik takip eden bir web tabanlı PWA uygulaması.

> **Önemli:** Bu spec, MVP (v1) kapsamını tanımlar. v2/v3 için "Backlog" bölümüne bakın. Claude Code, **kapsam dışı** bölümleri implemente etmemelidir.

**v2.0 Revize notu:** Satış funnel öncelik, MARKSOFT entegrasyonu sonra. Görev devir mekanizması eklendi.

---

## 1. Proje Bağlamı

**Kordinat**, marka ve patent vekilliği yapan bir fikri mülkiyet danışmanlık şirketidir. Mevcut durumda **MARKSOFT** adlı bir kurumsal marka-patent takip yazılımı kullanıyor. KORSALE, MARKSOFT'tan **bağımsız** ama veri alışverişi yapabilen, satış ve operasyon tarafını yöneten bir sistem olacak.

**Çözmek istediğimiz problemler:**
1. Firma görüşmelerinin kayıt dışı kalması
2. Verilen tekliflerin akıbetinin takip edilememesi
3. Onaylanan tekliflerin operasyona zamanında devredilememesi
4. Çalışan başına performans ve satış dönüşüm oranlarının görünmemesi
5. **Kim ne söz verdi, kim ne devraldı, hangi aşamada kim sorumlu — belirsizliği**
6. Görev devir anında bağlamın kaybolması (yeni sorumlu firmayı tanımıyor)

**Çözmediğimiz problemler (v1 dışı):**
- Detaylı muhasebe / fatura kesimi
- Detaylı kalite yönetim sistemi dokümantasyonu (sadece taslak)
- Marka-patent dosya takibi (bu MARKSOFT'ta kalıyor)
- MARKSOFT canlı API entegrasyonu (v1.5'e ertelendi)

---

## 2. Satış Funnel Felsefesi (KRİTİK)

KORSALE'nin **kalbi** satış funnel'ıdır. Her şey buna hizmet eder:

```
[FIRMA TESPİT] → [GÖRÜŞME] → [TEKLİF/TALİMAT/SÖZLEŞME] → [KABUL] → [OPERASYON] → [TAMAMLANDI]
                     ↓             ↓                        ↓           ↓
                  [DEVİR]      [DEVİR]                   [DEVİR]   [DEVİR]
```

Her aşamada:
- Bir **sorumlu** vardır (atanmış kişi)
- Aşama bir **durumdadır** (açık/beklemede/kapalı vb.)
- **Devir** her aşamada mümkündür ve **loglanır**
- Aşamalar arası geçiş **bağlamı taşır** (görüşme notları teklife, teklif içeriği operasyona)
- Her aşamanın bir **finansal değeri** vardır veya buna yöneliktir (pipeline değeri)

**Pipeline değeri hesabı:**
- Görüşme: tahmini iş tutarı (opsiyonel)
- Teklif: belge tutarı × kabul olasılığı (manuel, %0-100)
- Sözleşme: belge tutarı × 1.0
- Operasyon: kalan iş tutarı

Dashboard'da bu pipeline her aşama için kümülatif gösterilir. Klasik "huni" görseli.

---

## 3. Görev Devir Sistemi (YENİ — KRİTİK)

Görev devri her aşamada (Görüşme / Teklif / Operasyon) yapılabilir. Devir bir **işlemdir**, sadece veri güncellemesi değil.

### 3.1 Devir Kuralları

| Kural | Açıklama |
|---|---|
| **Kim devredebilir?** | Mevcut sorumlu VEYA Yönetici rolü |
| **Kime devredilebilir?** | Aktif kullanıcılar (aynı veya farklı rol) |
| **Devir notu zorunlu** | Devreden kişi minimum 50 karakter bağlam yazmalı |
| **Bildirim** | Devralan kişiye uygulama içi bildirim gider |
| **Onay** | Devralan "kabul ettim" veya "reddediyorum" diyebilir (24 saat içinde cevap yoksa otomatik kabul) |
| **Reddedilirse** | Devir gerçekleşmez, devreden ve Yönetici'ye bildirim |
| **Geri alma** | İlk 1 saat içinde devreden geri alabilir |
| **Tarihçe** | TÜM devirler `GorevDevir` tablosunda saklanır, hiç silinmez |

### 3.2 Devir Sırasında Taşınan Bilgiler

Devir sırasında devralan kişinin görmesi gereken minimum bağlam:
- Firma ile şimdiye kadar yapılan tüm görüşmeler özeti
- Firma ile bağlı tüm aktif teklif/operasyonlar
- Devreden kişinin yazdığı **devir notu** (öne çıkarılmış kart olarak)
- Firma kişi(leri) iletişim bilgileri
- Bu firma ile ilgili tüm notlar timeline'ı

Devralan ekran açıldığında üstte sarı bantta: *"Bu iş size [TARİH]'te [KİŞİ] tarafından devredildi. Devir notunu okuduğunuzu onaylayın."* — onaylamadan üzerinde işlem yapamaz.

### 3.3 Katkı Kayıtları (Komisyon Kavgasını Önler)

Bir iş tamamlandığında, **kim hangi aşamada sorumluydu** otomatik raporlanır:

- **İlk temas (görüşme yapan):** A
- **Teklif veren:** B
- **Sözleşme imzalatan:** B
- **Operasyon yürüten:** C
- **Devirler:** A→B (15.06.2026, sebep: bölge değişikliği), B→C (22.06.2026, sebep: operasyon ekibine geçti)

Raporlarda "Çalışan Performansı" üç ayrı metrik gösterir:
1. **Müşteri kazanımı** (ilk temas sayısı, görüşme→teklif dönüşümü)
2. **Satış kapatma** (teklif→sözleşme dönüşümü, kapatılan tutar)
3. **Operasyon tamamlama** (operasyon süresi, askıda kalma oranı)

Bu sayede tek bir "ciro" rakamına bakıp adaletsizlik yapılmaz.

---

## 4. Teknoloji Yığını (Kesin)

| Katman | Seçim | Gerekçe |
|---|---|---|
| Frontend | Next.js 14+ (App Router) + TypeScript | Web + PWA aynı kod tabanında |
| UI | Tailwind CSS + shadcn/ui + lucide-react | Hızlı, tutarlı, Effix tarzına yakın |
| Backend | Next.js API routes / Server Actions | Tek repo, deploy kolay |
| DB | PostgreSQL | Güçlü ilişkisel veri, JSONB esnekliği |
| ORM | Prisma | Tip güvenli, migration yönetimi kolay |
| Auth | NextAuth.js (Auth.js v5) + email/şifre + magic link | Hızlı kurulum |
| Form | React Hook Form + Zod | Tip güvenli validasyon |
| Tablo | TanStack Table | Filtreleme, sıralama, pagination |
| Grafik | Recharts | Hafif, React-native |
| Tarih | date-fns + Türkçe locale | TR tarih formatları |
| PWA | next-pwa | Mobilde "ana ekrana ekle" |
| Test | Vitest + Playwright (kritik akışlar için) | |
| Deploy | Docker + self-host (Hetzner Almanya önerilen) | KVKK + vekillik gizlilik |

---

## 5. Görsel Tasarım Dili

Referans: Effix CRM Dashboard (Dribbble). Birebir kopyalama yok, aşağıdaki prensiplere uy:

- **Renk paleti:** Beyaz arka plan, koyu lacivert (#0F172A civarı) navigation, mavi (#2563EB) primary action, durum renkleri yeşil/sarı/kırmızı/gri.
- **Tipografi:** Inter, başlık 18-24px, gövde 14px.
- **Boşluk:** Cömert padding. Tablo satırlarında bilgi yoğunluğu için sıkılaştırma kabul.
- **Köşe yumuşatma:** rounded-lg (8px) standart, kartlarda rounded-xl.
- **İkonlar:** lucide-react. Emoji yok.
- **Dil:** Tüm UI **Türkçe**. Tarih `gg.aa.yyyy`. Para `1.250.000 ₺`.
- **Mobil:** 360px'ten itibaren çalışır. Tablolar mobilde kart görünümüne döner.
- **Erişilebilirlik:** Tüm form input'larında label, klavye navigasyonu, WCAG AA kontrast.

### Funnel Görseli (Dashboard'da)
Klasik 4-kademeli huni görseli:
- Kademe 1: Aktif görüşmeler (sayı + toplam tahmini tutar)
- Kademe 2: Açık teklifler (sayı + toplam tutar × ortalama olasılık)
- Kademe 3: İmzalı sözleşmeler bekleyen operasyon (sayı + tutar)
- Kademe 4: Devam eden operasyon (sayı + kalan tutar)

Her kademede tıklayınca o aşamadaki kayıtlara filtreli gider.

---

## 6. Rol ve Yetki Matrisi

| Rol | Açıklama | Yetkiler |
|---|---|---|
| **Yönetici** | Kordinat yönetimi | Her şeyi görür/düzenler, kullanıcı yönetir, indirim onaylar, devir zorla yapabilir, raporları görür |
| **Satış** | Görüşme yapan, teklif veren | Kendi görüşme/tekliflerini ekler-düzenler, devir yapabilir, başkalarınınkini okur |
| **Operasyon** | Onaylı işi yürüten | Operasyon kayıtlarını günceller, devir yapabilir, görüşme/teklifi okur |
| **Gözlemci** | Sadece izleyen | Hiçbir şey değiştiremez |

**İndirim onay kuralı:** %15 üzeri indirim Yönetici onayı gerektirir. Ayarlardan değiştirilebilir.

**Devir özel kuralı:** Bir kullanıcı **kendinden başkasına** devredebilir. Yönetici, herkesin kaydını başkasına devredebilir (zorla devir — örn. çalışan ayrıldı).

---

## 7. Veri Modeli (Prisma Şeması)

> Claude Code: Aşağıdaki şemayı `prisma/schema.prisma` olarak kullan. Sonra `prisma migrate dev --name init`.

```prisma
// ============ AUTH & USERS ============

enum UserRole {
  YONETICI
  SATIS
  OPERASYON
  GOZLEMCI
}

model User {
  id            String     @id @default(cuid())
  email         String     @unique
  name          String
  role          UserRole   @default(SATIS)
  passwordHash  String?
  isActive      Boolean    @default(true)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  // Şu an sorumlu olduğu kayıtlar
  gorusmeSorumlu       Gorusme[]    @relation("GorusmeSorumlu")
  teklifSorumlu        Teklif[]     @relation("TeklifSorumlu")
  operasyonSorumlu     Operasyon[]  @relation("OperasyonSorumlu")

  // Katkı kayıtları (komisyon kavgası önlemi)
  gorusmeIlkTemas      Gorusme[]    @relation("GorusmeIlkTemas")
  teklifKapatan        Teklif[]     @relation("TeklifKapatan")

  // Devir geçmişi
  devirYapan           GorevDevir[] @relation("DevirYapan")
  devirAlan            GorevDevir[] @relation("DevirAlan")

  notlar               Not[]
  bildirimler          Bildirim[]
}

// ============ FİRMA & KİŞİ ============

model Firma {
  id           String   @id @default(cuid())
  ad           String
  vergiNo      String?
  sektor       String?
  sehir        String?
  telefon      String?
  email        String?
  web          String?
  marksoftId   String?  @unique  // MARKSOFT eşleşmesi için (v1.5'te aktif)
  kaynak       String?  // "Referans", "Web", "Fuar" vb. (satış analizi için)
  notlar       String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  kisiler    FirmaKisi[]
  gorusmeler Gorusme[]
  teklifler  Teklif[]

  @@index([ad])
}

model FirmaKisi {
  id       String  @id @default(cuid())
  firmaId  String
  ad       String
  unvan    String?
  telefon  String?
  email    String?
  birincil Boolean @default(false)

  firma    Firma   @relation(fields: [firmaId], references: [id], onDelete: Cascade)
}

// ============ GÖRÜŞME ============

enum GorusmeTipi {
  YUZ_YUZE
  TELEFON
  ONLINE
  EMAIL
  DIGER
}

enum GorusmeSonuc {
  TEKLIF_ISTENDI
  BILGI_VERILDI
  ILGISIZ
  ERTELENDI
  REDDEDILDI
  TEKRAR_ARANACAK
}

enum GorusmeDurum {
  ACIK         // hâlâ aktif (örn. tekrar aranacak)
  KAPALI       // tamamlandı (teklife dönüştü veya bitirildi)
}

model Gorusme {
  id              String       @id @default(cuid())
  firmaId         String
  sorumluId       String       // ŞU AN sorumlu olan (devir ile değişir)
  ilkTemasId      String       // İLK görüşmeyi yapan (sabit, değişmez)
  tarih           DateTime
  tip             GorusmeTipi
  yer             String?
  konu            String
  ozet            String
  sonuc           GorusmeSonuc
  durum           GorusmeDurum @default(ACIK)
  tahminiTutar    Decimal?     @db.Decimal(14,2)  // pipeline için
  hatirlatma      DateTime?
  marksoftSync    Boolean      @default(false)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  firma      Firma     @relation(fields: [firmaId], references: [id])
  sorumlu    User      @relation("GorusmeSorumlu", fields: [sorumluId], references: [id])
  ilkTemas   User      @relation("GorusmeIlkTemas", fields: [ilkTemasId], references: [id])
  teklifler  Teklif[]
  notlar     Not[]
  devirler   GorevDevir[]

  @@index([tarih])
  @@index([firmaId])
  @@index([sorumluId])
  @@index([durum])
}

// ============ TEKLİF / TALİMAT / SÖZLEŞME ============

enum BelgeTipi {
  TEKLIF
  TALIMAT
  SOZLESME
}

enum BelgeDurum {
  TASLAK
  ONAY_BEKLIYOR     // indirim onayı bekliyor (Yönetici onaylamadı)
  GONDERILDI
  BEKLEMEDE
  KABUL
  REDDEDILDI
  IPTAL
  SURESI_DOLDU
}

model Teklif {
  id              String       @id @default(cuid())
  belgeNo         String       @unique // örn: TKL-2026-0001
  belgeTipi       BelgeTipi
  firmaId         String
  gorusmeId       String?
  sorumluId       String       // ŞU AN sorumlu (devir ile değişir)
  hazirlayanId   String       // Kim hazırladı (sabit)
  kapatanId       String?      // Kim KABUL/RED kararını aldı (sözleşme aşamasında)
  baslik          String
  icerik          String       // operasyon içeriği (rich text)
  tutar           Decimal      @db.Decimal(14,2)
  paraBirimi      String       @default("TRY")
  indirimYuzde    Decimal?     @db.Decimal(5,2)
  indirimOnayId   String?      // onaylayan yönetici user.id
  indirimOnayTar  DateTime?
  netTutar        Decimal      @db.Decimal(14,2)
  kabulOlasilik   Int          @default(50)  // %0-100, pipeline için manuel
  gecerlilikTarih DateTime?
  durum           BelgeDurum   @default(TASLAK)
  gonderilmeTar   DateTime?
  kabulTar        DateTime?
  redNedeni       String?
  dosyaUrl        String?      // yüklenmiş PDF
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  firma       Firma     @relation(fields: [firmaId], references: [id])
  gorusme     Gorusme?  @relation(fields: [gorusmeId], references: [id])
  sorumlu     User      @relation("TeklifSorumlu", fields: [sorumluId], references: [id])
  kapatan     User?     @relation("TeklifKapatan", fields: [kapatanId], references: [id])
  operasyon   Operasyon?
  notlar      Not[]
  devirler    GorevDevir[]

  @@index([durum])
  @@index([firmaId])
  @@index([gonderilmeTar])
  @@index([sorumluId])
}

// ============ OPERASYON ============

enum OperasyonDurum {
  BEKLIYOR
  DEVAM_EDIYOR
  ASKIDA
  TAMAMLANDI
  IPTAL
}

model Operasyon {
  id            String          @id @default(cuid())
  teklifId      String          @unique
  sorumluId     String          // ŞU AN sorumlu (devir ile değişir)
  baslangicTar  DateTime?
  bitisTar      DateTime?
  hedefBitisTar DateTime?
  durum         OperasyonDurum  @default(BEKLIYOR)
  bekletmeNeden String?         // ASKIDA ise neden
  ilerlemeYuzde Int             @default(0)
  sonDurum      String?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  teklif     Teklif         @relation(fields: [teklifId], references: [id])
  sorumlu    User           @relation("OperasyonSorumlu", fields: [sorumluId], references: [id])
  asamalar   OperasyonAsama[]
  notlar     Not[]
  devirler   GorevDevir[]
}

model OperasyonAsama {
  id           String    @id @default(cuid())
  operasyonId  String
  baslik       String
  tamamlandi   Boolean   @default(false)
  tamamTar     DateTime?
  sira         Int

  operasyon    Operasyon @relation(fields: [operasyonId], references: [id], onDelete: Cascade)
}

// ============ GÖREV DEVİR (YENİ) ============

enum DevirHedefTipi {
  GORUSME
  TEKLIF
  OPERASYON
}

enum DevirDurum {
  BEKLIYOR      // devralan henüz cevap vermedi
  KABUL
  REDDEDILDI
  GERI_ALINDI   // devreden 1 saat içinde geri aldı
  ZORLA_DEVIR   // Yönetici zorla devretti (kabul gerekmedi)
}

model GorevDevir {
  id           String          @id @default(cuid())
  hedefTipi    DevirHedefTipi  // hangi entity devrediliyor
  gorusmeId    String?
  teklifId     String?
  operasyonId  String?

  devredenId   String          // devreden user
  devralanId   String          // devralan user
  devirNotu    String          // ZORUNLU, min 50 karakter
  durum        DevirDurum      @default(BEKLIYOR)
  cevapTar     DateTime?
  redNedeni    String?
  createdAt    DateTime        @default(now())

  devreden  User       @relation("DevirYapan", fields: [devredenId], references: [id])
  devralan  User       @relation("DevirAlan", fields: [devralanId], references: [id])
  gorusme   Gorusme?   @relation(fields: [gorusmeId], references: [id], onDelete: Cascade)
  teklif    Teklif?    @relation(fields: [teklifId], references: [id], onDelete: Cascade)
  operasyon Operasyon? @relation(fields: [operasyonId], references: [id], onDelete: Cascade)

  @@index([devralanId, durum])
  @@index([createdAt])
}

// ============ NOT ============

model Not {
  id           String   @id @default(cuid())
  yazanId      String
  icerik       String
  gorusmeId    String?
  teklifId     String?
  operasyonId  String?
  createdAt    DateTime @default(now())

  yazan      User       @relation(fields: [yazanId], references: [id])
  gorusme    Gorusme?   @relation(fields: [gorusmeId], references: [id], onDelete: Cascade)
  teklif     Teklif?    @relation(fields: [teklifId], references: [id], onDelete: Cascade)
  operasyon  Operasyon? @relation(fields: [operasyonId], references: [id], onDelete: Cascade)
}

// ============ BİLDİRİM ============

enum BildirimTipi {
  DEVIR_TALEBI
  DEVIR_KABUL
  DEVIR_RED
  TEKLIF_CEVAP_BEKLIYOR
  TEKLIF_SURESI_DOLUYOR
  INDIRIM_ONAY_GEREKLI
  OPERASYON_ASKIDA
  OPERASYON_GECIKTI
  HATIRLATMA
}

model Bildirim {
  id         String       @id @default(cuid())
  userId     String
  tip        BildirimTipi
  baslik     String
  icerik     String
  link       String?      // hangi sayfaya yönlendirir
  okundu     Boolean      @default(false)
  createdAt  DateTime     @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId, okundu])
}

// ============ DOKÜMANTASYON (KYS taslağı — basit) ============

enum DokumanTipi {
  SISTEM_TARIF
  YAZI_BILGI
  TEKLIF_SABLON
  LISTE_FORM
}

model Dokuman {
  id         String      @id @default(cuid())
  tip        DokumanTipi
  baslik     String
  icerik     String      // markdown
  versiyon   Int         @default(1)
  aktif      Boolean     @default(true)
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
}

// ============ AYAR ============

model Ayar {
  anahtar  String  @id
  deger    String
  // örn: { "indirim_onay_yuzde": "15", "firma_adi": "Kordinat", ... }
}

// ============ AUDIT LOG ============

model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  aksiyon   String   // CREATE, UPDATE, DELETE, LOGIN, DEVIR, ...
  entity    String   // Teklif, Gorusme, Operasyon, ...
  entityId  String
  detay     String?  // JSON
  createdAt DateTime @default(now())

  @@index([createdAt])
  @@index([entity, entityId])
}
```

---

## 8. Ekran ve Akış Spesifikasyonları

### 8.1 Genel Layout
- Sol sidebar: Logo, **Dashboard**, **Funnel**, Firmalar, Görüşmeler, Teklifler, Operasyonlar, **Bana Gelen Devirler** (badge ile sayı), Dokümanlar, Raporlar, Ayarlar
- Üst bar: Global arama, bildirim ikonu (okunmamış sayı), kullanıcı menüsü
- Sağ üst: "Hızlı Devret" kısayolu (mevcut sayfa hangiyse ona göre)

### 8.2 Dashboard (Ana Sayfa)

**Üst 4 KPI kartı:**
1. Bu ay görüşme sayısı (+ geçen aya göre %değişim)
2. Açık teklif sayısı + toplam tutar
3. Bu ay kapatılan iş tutarı (sözleşme)
4. Devam eden operasyon sayısı

**Funnel görseli** (büyük, dikkat çekici): 4 kademeli huni, her kademenin sayı ve tutarı yazıyor.

**Alt bölüm:**
- Sol: "Bana gelen devirler" + "Bu hafta dikkat" (cevap bekleyen teklifler, hatırlatma günü, askıda kalan)
- Sağ: Son aktiviteler akışı
- Alt: Aylık görüşme→teklif→sözleşme dönüşüm grafiği (son 6 ay)

### 8.3 Funnel Sayfası (YENİ — özel sayfa)

Tam ekran satış funnel görünümü:
- 4 kolon: Görüşmeler / Teklifler / Sözleşmeler / Operasyon
- Her kolonda kayıtlar kart olarak (Kanban benzeri)
- Kart üstüne firma adı, sorumlu kişi avatarı, tutar, son güncelleme
- Karta tıklayınca detay açılır
- Kartı **sürükleyip bırakarak** durum değiştirme YOK (yanlış kullanım riski). Bunun yerine kartta açık aksiyon butonları:
  - Görüşme → "Teklif Oluştur"
  - Teklif → "Gönder" / "Kabul" / "Reddet"
  - Sözleşme → "Operasyona Aktar"
- Sağ üstte filtre: kendi kayıtlarım / herkesinki / sorumlu kişi seç

### 8.4 Firmalar
- Liste: arama, sektör/şehir/kaynak filtresi, sayfalama
- Detay: firma bilgileri + kişiler + bu firmayla yapılan tüm görüşmeler + teklifler timeline'ı
- Yeni firma ekleme
- **CSV import** (sütun eşleştirme arayüzü ile) — Sprint 2'de basit, Sprint 6'da MARKSOFT için sofistike

### 8.5 Görüşmeler
- Liste: tarihe/sorumluya/sonuca göre filtre, durum (ACIK/KAPALI)
- Yeni görüşme: firma seç (autocomplete) → tarih → tip → konu → özet → sonuç → tahmini tutar (opsiyonel)
- Sonuç "TEKLIF_ISTENDI" ise **"Teklif Oluştur"** butonu — bağlam taşınır
- Sayfa içinde **"Devret"** butonu (sağ üst)

### 8.6 Teklifler / Talimatlar / Sözleşmeler
- Liste: durum sekmeleri (Taslak / Onay Bekliyor / Gönderildi / Beklemede / Kabul / Reddedildi)
- Yeni teklif formu:
  - Belge tipi (Teklif/Talimat/Sözleşme)
  - Firma + Görüşme (opsiyonel)
  - Sorumlu (varsayılan: oluşturan)
  - Başlık + İçerik (Tiptap basit rich text)
  - Tutar + Para birimi + İndirim%
  - **İndirim > %15 ise**: durum otomatik ONAY_BEKLIYOR, Yönetici(ler)e bildirim
  - Kabul olasılığı (slider %0-100)
  - Geçerlilik tarihi
  - PDF yükleme (opsiyonel)
- Belge no otomatik: `TKL-2026-0001`, `SOZ-2026-0001`
- Sayfa içinde **"Devret"** butonu
- KABUL edildiğinde **"Operasyona Aktar"** butonu (bağlam taşınır)

### 8.7 Operasyonlar
- Liste: durum filtreli (Bekliyor / Devam / Askıda / Tamamlandı)
- Detay: bağlı teklif bilgileri + sorumlu + tarihler + aşamalar checklist + son durum notu
- Askıya alma: zorunlu sebep
- İlerleme % manuel veya aşamalardan otomatik
- Sayfa içinde **"Devret"** butonu

### 8.8 Bana Gelen Devirler (YENİ özel sayfa)

Üç sekme:
1. **Bekleyenler:** Bana devredilmiş ama henüz cevap vermediklerim
2. **Kabul ettiklerim:** Aktif sorumlusu olduklarım (kısayol listesi)
3. **Reddettiklerim / Geçmiş:** Tarihçe

Bekleyen devirde:
- Devredenin adı, devir notu (büyük gösterilir)
- Firma + bağlam özeti
- "Kabul Et" / "Reddet (sebep yaz)" butonları
- 24 saatlik geri sayım (otomatik kabul olacak)

### 8.9 Devir Aksiyonu (Modal)

Herhangi bir görüşme/teklif/operasyon sayfasından "Devret" tıklanınca açılan modal:
- Devralan kullanıcı seç (dropdown, arama ile)
- **Devir notu** (zorunlu, min 50 karakter, hint: "Bu işin durumunu, müşterinin beklentilerini, dikkat edilmesi gereken hususları yazın")
- Önizleme: "Bu işi [KİŞİ]'ye devredeceksiniz. Onay verene kadar siz sorumlu olarak görüneceksiniz."
- Yönetici ise: **"Zorla devret (onay gerektirmez)"** kutucuğu

Modal kaydedildiğinde:
- `GorevDevir` kaydı oluşur (durum: BEKLIYOR veya ZORLA_DEVIR)
- ZORLA_DEVIR ise `sorumluId` anında değişir
- Normal devirde devralan kabul edene kadar `sorumluId` değişmez ama bildirim gider

### 8.10 Dokümanlar (KYS taslağı — basit, v1 sonunda)
- 4 sekme: Sistemler ve Tarifler / Yazılar ve Bilgiler / Teklif-Talimat-Sözleşme Şablonları / Listeler ve Formlar
- Markdown editör
- Versiyon takibi (yeni kayıt = yeni versiyon)
- Aktif/pasif toggle

### 8.11 Raporlar
- **Çalışan performansı** (üç ayrı sekme):
  - Müşteri kazanımı (ilk temas sayısı, görüşme→teklif dönüşüm %)
  - Satış kapatma (teklif→sözleşme dönüşüm %, kapatılan tutar)
  - Operasyon (tamamlanan sayı, ortalama süre, askıda kalma %)
- **Devir analizi:**
  - En çok devir yapan/alan kişiler
  - En çok devredilen firmalar (kötü sinyal olabilir)
  - Devir → satış dönüşüm karşılaştırması (devirli vs devirsiz)
- **Funnel analizi:** aşama bazlı dönüşüm oranları, sızıntı analizi
- **Firma analizi:** en çok ciro, en çok red
- **Dönem analizi:** ay/çeyrek bazlı trend
- Tümü CSV/Excel export

### 8.12 Ayarlar (Yönetici)
- Kullanıcı yönetimi (CRUD + rol)
- Sistem parametreleri (indirim onay eşiği, belge no formatı, devir otomatik kabul süresi)
- Bildirim tercihleri
- MARKSOFT entegrasyon ayarları (Sprint 7+)

---

## 9. Temel KPI Tanımları

| KPI | Formül | Periyot |
|---|---|---|
| Görüşme → Teklif Dönüşüm % | Teklif oluşan görüşme / Toplam görüşme | Aylık |
| Teklif → Sözleşme Dönüşüm % | KABUL teklif / GONDERILDI teklif | Aylık |
| Ortalama Teklif Yanıt Süresi | (Kabul/Red tarihi − Gönderilme tarihi) ort. | Aylık |
| Çalışan Müşteri Kazanım Skoru | İlk temas sayısı + (görüşme→teklif dönüşümü × ağırlık) | Aylık |
| Çalışan Satış Kapatma Skoru | Kapatılan toplam netTutar (kapatanId = X) | Aylık/Yıllık |
| Operasyon Tamamlanma Süresi | (bitisTar − baslangicTar) ortalaması | Çeyrek |
| Askıda Kalan İş Oranı | ASKIDA operasyon / Toplam aktif operasyon | Anlık |
| Devirli İşlerin Başarı Oranı | KABUL/(devredilmiş teklif sayısı) | Aylık |
| Pipeline Değeri | Σ(teklif tutar × kabulOlasilik/100) | Anlık |

---

## 10. Bildirim ve Uyarı Kuralları

Uygulama içi bildirim üretilen durumlar (e-posta v2):

1. **Devir talebi:** Sana yeni devir geldi → devralan'a anında
2. **Devir kabul:** Devrettiğin iş kabul edildi → devreden'e
3. **Devir red:** Devrettiğin iş reddedildi → devreden + Yönetici
4. **Devir otomatik kabul:** 24 saat doldu, otomatik kabul edildi → devralan + devreden
5. **Teklif yanıt bekliyor:** 7 gün cevapsız → sorumlu'ya
6. **Geçerlilik dolmak üzere:** 3 gün önce → sorumlu'ya
7. **Görüşme hatırlatması:** Tarih gelmiş → sorumlu'ya
8. **Askıda kalan operasyon:** 5+ gün ASKIDA → sorumlu + Yönetici
9. **İndirim onay talebi:** Eşik üstü → tüm Yöneticilere
10. **Operasyon hedef yaklaşıyor:** 2 gün kala → sorumlu
11. **Operasyon hedef geçti:** Hedef geçildi, hâlâ devam ediyor → sorumlu + Yönetici

Bildirimler bir günlük cron job ile taranır, anlık olanlar (devir vb.) Server Action içinde tetiklenir.

---

## 11. Güvenlik ve Veri Koruması

- Şifreler bcrypt (en az 12 round)
- Form girişleri Zod ile validate
- SQL injection: Prisma korur
- XSS: rich text çıktısı DOMPurify ile sanitize
- CSRF: NextAuth yönetir
- Yetki: her API endpoint + UI seviyesinde
- Audit log: kritik işlemler (teklif onayı, indirim onayı, devir, yetki değişimi) loglanır
- **KVKK + Vekillik gizliliği:** Self-host Hetzner Almanya. Firma kişi verileri için silme talebi (cascade + log)
- Yedekleme: PostgreSQL günlük otomatik backup

---

## 12. PWA Özellikleri

- `manifest.json` ile "Ana Ekrana Ekle"
- Çevrimdışı görüntüleme (son sayfalar service worker ile)
- Mobil-öncelikli responsive
- Push notification → v2

---

## 13. Geliştirme Sırası (Sprint Planı — REVİZE)

**Öncelik sırası:**
1. Satış funnel (Sprint 1-5)
2. Devir sistemi (Sprint 3 itibariyle paralel)
3. MARKSOFT entegrasyonu (Sprint 7 — v1 son sprint, en sonda)

### Sprint 1 — Temel İskelet (1-2 hafta)
1. Next.js + TS + Tailwind + Prisma kurulumu
2. PostgreSQL bağlantısı, ilk migration
3. NextAuth ile login/logout/şifre sıfırlama
4. Layout (sidebar + top bar + responsive)
5. Kullanıcı CRUD (Yönetici)
6. Ayarlar sayfası iskeleti

### Sprint 2 — Firma + Görüşme (1-2 hafta)
7. Firma CRUD + arama + kişi yönetimi
8. Görüşme CRUD + firma ilişkisi
9. Firma detay sayfasında görüşme timeline
10. Görüşme durum yönetimi (ACIK/KAPALI)

### Sprint 3 — Teklif + Devir Sistemi Tohumu (2 hafta)
11. Teklif CRUD + belge no üretimi
12. İndirim onay akışı (ONAY_BEKLIYOR durumu)
13. Görüşme → Teklif geçişi (bağlam taşıma)
14. PDF upload (basit dosya storage)
15. **GorevDevir modeli + devir modal'ı (görüşme ve teklif için)**
16. **Bildirim sistemi tohumu (uygulama içi)**
17. **"Bana Gelen Devirler" sayfası**

### Sprint 4 — Operasyon + Devir Tamamlama (1-2 hafta)
18. Teklif KABUL → Operasyon oluşturma
19. Operasyon CRUD + aşamalar
20. Askıya alma + sebep zorunluluğu
21. **Operasyon için devir entegrasyonu**
22. **24 saat otomatik kabul cron'u**
23. **1 saat içinde geri alma**
24. **Zorla devir (Yönetici)**

### Sprint 5 — Funnel + Dashboard + Raporlar (2 hafta)
25. **Funnel sayfası (Kanban benzeri)**
26. Dashboard KPI kartları + funnel görseli
27. Aktivite akışı
28. Aylık dönüşüm grafiği
29. Çalışan performans raporu (3 ayrı metrik)
30. **Devir analizi raporu**
31. Funnel analizi raporu
32. CSV/Excel export

### Sprint 6 — Dokümantasyon + Polish + PWA (1-2 hafta)
33. Dokümanlar modülü (markdown editör, versiyon)
34. CSV import (genel — sütun eşleştirme)
35. PWA manifest + service worker + ikon
36. Audit log görüntüleme
37. Performans optimizasyonu (indeksler, sayfalama)
38. E2E testler (Playwright) — kritik akışlar (login, görüşme→teklif→operasyon, devir)

### Sprint 7 — MARKSOFT Entegrasyonu (v1.5, ayrı sprint)
> **NOT:** MARKSOFT'un API/export formatı netleşmeden başlanmaz. v1 buraya kadar kullanıma açılabilir.
39. MARKSOFT veri yapısı analizi (Zarko ile birlikte)
40. CSV/Excel sofistike import (MARKSOFT export formatına özel)
41. Otomatik firma eşleştirme (vergi no / isim benzerliği)
42. `marksoftId` alanı doldurma
43. (Eğer API varsa) iki yönlü sync

**Her sprint sonunda test ve deploy edilebilir.**

---

## 14. Backlog (v2 ve Sonrası — v1'de YAPMA)

- MARKSOFT canlı API entegrasyonu (iki yönlü real-time)
- E-posta bildirim
- Push notification
- Detaylı fatura kesimi / muhasebe entegrasyonu
- Detaylı KYS (versiyon karşılaştırma, onay workflow)
- Müşteri portalı (firmanın kendi tekliflerini görmesi)
- AI destekli teklif şablonu üretimi
- Çoklu dil desteği
- Native mobil uygulama
- Power BI / dış raporlama entegrasyonu
- Multi-tenant SaaS dönüşümü (diğer marka-patent vekillerine satış için)
- Komisyon hesaplama otomasyonu (çoklu katkı kayıtlarına göre)

---

## 15. Kabul Kriterleri (Definition of Done)

Bir özellik "bitti" sayılabilmesi için:
- TypeScript hata yok
- Lint hata yok
- İlgili Zod şeması var
- Yetki kontrolü hem UI hem API'de var
- Mobil görünüm test edildi
- Türkçe metinler doğru, tarih/para formatı doğru
- Boş durum, hata durumu, yükleme durumu ekranları var
- **Devir kaydı içeren akışlarda devir geçmişi görüntülenebiliyor**
- Audit log uygun yerde tutuluyor

---

## 16. Çalıştırma Talimatları (Claude Code İçin)

```bash
# 1. Proje kur
npx create-next-app@latest korsale --typescript --tailwind --app
cd korsale

# 2. Bağımlılıklar
npm install @prisma/client prisma next-auth@beta @auth/prisma-adapter \
  bcryptjs react-hook-form @hookform/resolvers zod \
  @tanstack/react-table recharts date-fns \
  lucide-react class-variance-authority clsx tailwind-merge \
  next-pwa @tiptap/react @tiptap/starter-kit \
  papaparse xlsx

npm install -D @types/bcryptjs @types/papaparse vitest @playwright/test

# 3. shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button input label form table card dialog \
  select textarea tabs badge dropdown-menu toast sonner avatar \
  alert progress separator skeleton tooltip

# 4. Prisma
npx prisma init
# (schema.prisma'yı yukarıdaki ile doldur)
npx prisma migrate dev --name init
npx prisma generate

# 5. Seed verisi (test için)
# prisma/seed.ts: 1 Yönetici + 2 Satış + 1 Operasyon + 3 Firma + örnek görüşme/teklif

# 6. Geliştirme
npm run dev
```

---

## 17. Zarko'nun Karar Vermesi Gerekenler (Claude Code Başlamadan Önce)

1. **Domain ve hosting:** Hetzner Almanya (önerilen, KVKK + vekillik gizliliği için) mi başka mı?
2. **MARKSOFT API erişimi:** Var mı, dokümantasyonu var mı? — Sprint 7'ye kadar netleşmesi yeter
3. **Mevcut firma verisi:** Şu an kaç firma var? Hangi formatta? (Sprint 2 başında import için)
4. **Belge numarası formatı:** `TKL-2026-0001` uygun mu?
5. **İndirim onay eşiği:** %15 doğru mu?
6. **Devir otomatik kabul süresi:** 24 saat uygun mu, daha kısa/uzun mu?
7. **Devir notu minimum karakter:** 50 yeterli mi, daha sıkı/gevşek mi?
8. **Para birimi:** Sadece TRY mi, USD/EUR de mi?
9. **Logo ve marka:** Kordinat logosu var mı? Renk kodları?
10. **Kullanıcı sayısı:** v1'de kaç kişi kullanacak?
11. **Çalışan listesi:** İlk açılışta hangi kullanıcıları seed olarak ekleyelim?

---

## Son Söz

Bu spec, scope creep'i engellemek için **kasıtlı olarak dar** tutulmuştur. Satış funnel ve devir sistemi v1'in omurgasıdır — MARKSOFT entegrasyonu en sona bilinçli olarak bırakılmıştır çünkü:

1. MARKSOFT API/format bilgisi henüz net değil — beklemeden başka şeyler yapılabilir
2. KORSALE kendi başına değer üretmeli, MARKSOFT'a bağımlı olmamalı
3. v1'i kullanmaya başladığında MARKSOFT entegrasyonunun gerçek ihtiyacı netleşir

v1'de çalışan ve takım tarafından gerçekten kullanılan bir sistem, sonradan eklenecek 50 özellikten daha değerlidir.

— *KORSALE v2.0 Specification Document*
