-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('YONETICI', 'SATIS', 'OPERASYON', 'GOZLEMCI');

-- CreateEnum
CREATE TYPE "GorusmeTipi" AS ENUM ('YUZ_YUZE', 'TELEFON', 'ONLINE', 'EMAIL', 'DIGER');

-- CreateEnum
CREATE TYPE "GorusmeSonuc" AS ENUM ('TEKLIF_ISTENDI', 'BILGI_VERILDI', 'ILGISIZ', 'ERTELENDI', 'REDDEDILDI', 'TEKRAR_ARANACAK');

-- CreateEnum
CREATE TYPE "GorusmeDurum" AS ENUM ('ACIK', 'KAPALI');

-- CreateEnum
CREATE TYPE "BelgeTipi" AS ENUM ('TEKLIF', 'TALIMAT', 'SOZLESME');

-- CreateEnum
CREATE TYPE "BelgeDurum" AS ENUM ('TASLAK', 'ONAY_BEKLIYOR', 'GONDERILDI', 'BEKLEMEDE', 'KABUL', 'REDDEDILDI', 'IPTAL', 'SURESI_DOLDU');

-- CreateEnum
CREATE TYPE "OperasyonDurum" AS ENUM ('BEKLIYOR', 'DEVAM_EDIYOR', 'ASKIDA', 'TAMAMLANDI', 'IPTAL');

-- CreateEnum
CREATE TYPE "DevirHedefTipi" AS ENUM ('GORUSME', 'TEKLIF', 'OPERASYON');

-- CreateEnum
CREATE TYPE "DevirDurum" AS ENUM ('BEKLIYOR', 'KABUL', 'REDDEDILDI', 'GERI_ALINDI', 'ZORLA_DEVIR');

-- CreateEnum
CREATE TYPE "BildirimTipi" AS ENUM ('DEVIR_TALEBI', 'DEVIR_KABUL', 'DEVIR_RED', 'TEKLIF_CEVAP_BEKLIYOR', 'TEKLIF_SURESI_DOLUYOR', 'INDIRIM_ONAY_GEREKLI', 'OPERASYON_ASKIDA', 'OPERASYON_GECIKTI', 'HATIRLATMA');

-- CreateEnum
CREATE TYPE "DokumanTipi" AS ENUM ('SISTEM_TARIF', 'YAZI_BILGI', 'TEKLIF_SABLON', 'LISTE_FORM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'SATIS',
    "passwordHash" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Firma" (
    "id" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "vergiNo" TEXT,
    "sektor" TEXT,
    "sehir" TEXT,
    "telefon" TEXT,
    "email" TEXT,
    "web" TEXT,
    "marksoftId" TEXT,
    "kaynak" TEXT,
    "notlar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Firma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FirmaKisi" (
    "id" TEXT NOT NULL,
    "firmaId" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "unvan" TEXT,
    "telefon" TEXT,
    "email" TEXT,
    "birincil" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FirmaKisi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gorusme" (
    "id" TEXT NOT NULL,
    "firmaId" TEXT NOT NULL,
    "sorumluId" TEXT NOT NULL,
    "ilkTemasId" TEXT NOT NULL,
    "tarih" TIMESTAMP(3) NOT NULL,
    "tip" "GorusmeTipi" NOT NULL,
    "yer" TEXT,
    "konu" TEXT NOT NULL,
    "ozet" TEXT NOT NULL,
    "sonuc" "GorusmeSonuc" NOT NULL,
    "durum" "GorusmeDurum" NOT NULL DEFAULT 'ACIK',
    "tahminiTutar" DECIMAL(14,2),
    "hatirlatma" TIMESTAMP(3),
    "marksoftSync" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gorusme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teklif" (
    "id" TEXT NOT NULL,
    "belgeNo" TEXT NOT NULL,
    "belgeTipi" "BelgeTipi" NOT NULL,
    "firmaId" TEXT NOT NULL,
    "gorusmeId" TEXT,
    "sorumluId" TEXT NOT NULL,
    "hazirlayanId" TEXT NOT NULL,
    "kapatanId" TEXT,
    "baslik" TEXT NOT NULL,
    "icerik" TEXT NOT NULL,
    "tutar" DECIMAL(14,2) NOT NULL,
    "paraBirimi" TEXT NOT NULL DEFAULT 'TRY',
    "indirimYuzde" DECIMAL(5,2),
    "indirimOnayId" TEXT,
    "indirimOnayTar" TIMESTAMP(3),
    "netTutar" DECIMAL(14,2) NOT NULL,
    "kabulOlasilik" INTEGER NOT NULL DEFAULT 50,
    "gecerlilikTarih" TIMESTAMP(3),
    "durum" "BelgeDurum" NOT NULL DEFAULT 'TASLAK',
    "gonderilmeTar" TIMESTAMP(3),
    "kabulTar" TIMESTAMP(3),
    "redNedeni" TEXT,
    "dosyaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Teklif_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operasyon" (
    "id" TEXT NOT NULL,
    "teklifId" TEXT NOT NULL,
    "sorumluId" TEXT NOT NULL,
    "baslangicTar" TIMESTAMP(3),
    "bitisTar" TIMESTAMP(3),
    "hedefBitisTar" TIMESTAMP(3),
    "durum" "OperasyonDurum" NOT NULL DEFAULT 'BEKLIYOR',
    "bekletmeNeden" TEXT,
    "ilerlemeYuzde" INTEGER NOT NULL DEFAULT 0,
    "sonDurum" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operasyon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperasyonAsama" (
    "id" TEXT NOT NULL,
    "operasyonId" TEXT NOT NULL,
    "baslik" TEXT NOT NULL,
    "tamamlandi" BOOLEAN NOT NULL DEFAULT false,
    "tamamTar" TIMESTAMP(3),
    "sira" INTEGER NOT NULL,

    CONSTRAINT "OperasyonAsama_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GorevDevir" (
    "id" TEXT NOT NULL,
    "hedefTipi" "DevirHedefTipi" NOT NULL,
    "gorusmeId" TEXT,
    "teklifId" TEXT,
    "operasyonId" TEXT,
    "devredenId" TEXT NOT NULL,
    "devralanId" TEXT NOT NULL,
    "devirNotu" TEXT NOT NULL,
    "durum" "DevirDurum" NOT NULL DEFAULT 'BEKLIYOR',
    "cevapTar" TIMESTAMP(3),
    "redNedeni" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GorevDevir_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Not" (
    "id" TEXT NOT NULL,
    "yazanId" TEXT NOT NULL,
    "icerik" TEXT NOT NULL,
    "gorusmeId" TEXT,
    "teklifId" TEXT,
    "operasyonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Not_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bildirim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tip" "BildirimTipi" NOT NULL,
    "baslik" TEXT NOT NULL,
    "icerik" TEXT NOT NULL,
    "link" TEXT,
    "okundu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bildirim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dokuman" (
    "id" TEXT NOT NULL,
    "tip" "DokumanTipi" NOT NULL,
    "baslik" TEXT NOT NULL,
    "icerik" TEXT NOT NULL,
    "versiyon" INTEGER NOT NULL DEFAULT 1,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dokuman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ayar" (
    "anahtar" TEXT NOT NULL,
    "deger" TEXT NOT NULL,

    CONSTRAINT "Ayar_pkey" PRIMARY KEY ("anahtar")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aksiyon" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "detay" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Firma_marksoftId_key" ON "Firma"("marksoftId");

-- CreateIndex
CREATE INDEX "Firma_ad_idx" ON "Firma"("ad");

-- CreateIndex
CREATE INDEX "Gorusme_tarih_idx" ON "Gorusme"("tarih");

-- CreateIndex
CREATE INDEX "Gorusme_firmaId_idx" ON "Gorusme"("firmaId");

-- CreateIndex
CREATE INDEX "Gorusme_sorumluId_idx" ON "Gorusme"("sorumluId");

-- CreateIndex
CREATE INDEX "Gorusme_durum_idx" ON "Gorusme"("durum");

-- CreateIndex
CREATE UNIQUE INDEX "Teklif_belgeNo_key" ON "Teklif"("belgeNo");

-- CreateIndex
CREATE INDEX "Teklif_durum_idx" ON "Teklif"("durum");

-- CreateIndex
CREATE INDEX "Teklif_firmaId_idx" ON "Teklif"("firmaId");

-- CreateIndex
CREATE INDEX "Teklif_gonderilmeTar_idx" ON "Teklif"("gonderilmeTar");

-- CreateIndex
CREATE INDEX "Teklif_sorumluId_idx" ON "Teklif"("sorumluId");

-- CreateIndex
CREATE UNIQUE INDEX "Operasyon_teklifId_key" ON "Operasyon"("teklifId");

-- CreateIndex
CREATE INDEX "GorevDevir_devralanId_durum_idx" ON "GorevDevir"("devralanId", "durum");

-- CreateIndex
CREATE INDEX "GorevDevir_createdAt_idx" ON "GorevDevir"("createdAt");

-- CreateIndex
CREATE INDEX "Bildirim_userId_okundu_idx" ON "Bildirim"("userId", "okundu");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- AddForeignKey
ALTER TABLE "FirmaKisi" ADD CONSTRAINT "FirmaKisi_firmaId_fkey" FOREIGN KEY ("firmaId") REFERENCES "Firma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gorusme" ADD CONSTRAINT "Gorusme_firmaId_fkey" FOREIGN KEY ("firmaId") REFERENCES "Firma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gorusme" ADD CONSTRAINT "Gorusme_sorumluId_fkey" FOREIGN KEY ("sorumluId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gorusme" ADD CONSTRAINT "Gorusme_ilkTemasId_fkey" FOREIGN KEY ("ilkTemasId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teklif" ADD CONSTRAINT "Teklif_firmaId_fkey" FOREIGN KEY ("firmaId") REFERENCES "Firma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teklif" ADD CONSTRAINT "Teklif_gorusmeId_fkey" FOREIGN KEY ("gorusmeId") REFERENCES "Gorusme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teklif" ADD CONSTRAINT "Teklif_sorumluId_fkey" FOREIGN KEY ("sorumluId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teklif" ADD CONSTRAINT "Teklif_kapatanId_fkey" FOREIGN KEY ("kapatanId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operasyon" ADD CONSTRAINT "Operasyon_teklifId_fkey" FOREIGN KEY ("teklifId") REFERENCES "Teklif"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operasyon" ADD CONSTRAINT "Operasyon_sorumluId_fkey" FOREIGN KEY ("sorumluId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperasyonAsama" ADD CONSTRAINT "OperasyonAsama_operasyonId_fkey" FOREIGN KEY ("operasyonId") REFERENCES "Operasyon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GorevDevir" ADD CONSTRAINT "GorevDevir_devredenId_fkey" FOREIGN KEY ("devredenId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GorevDevir" ADD CONSTRAINT "GorevDevir_devralanId_fkey" FOREIGN KEY ("devralanId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GorevDevir" ADD CONSTRAINT "GorevDevir_gorusmeId_fkey" FOREIGN KEY ("gorusmeId") REFERENCES "Gorusme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GorevDevir" ADD CONSTRAINT "GorevDevir_teklifId_fkey" FOREIGN KEY ("teklifId") REFERENCES "Teklif"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GorevDevir" ADD CONSTRAINT "GorevDevir_operasyonId_fkey" FOREIGN KEY ("operasyonId") REFERENCES "Operasyon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Not" ADD CONSTRAINT "Not_yazanId_fkey" FOREIGN KEY ("yazanId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Not" ADD CONSTRAINT "Not_gorusmeId_fkey" FOREIGN KEY ("gorusmeId") REFERENCES "Gorusme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Not" ADD CONSTRAINT "Not_teklifId_fkey" FOREIGN KEY ("teklifId") REFERENCES "Teklif"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Not" ADD CONSTRAINT "Not_operasyonId_fkey" FOREIGN KEY ("operasyonId") REFERENCES "Operasyon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bildirim" ADD CONSTRAINT "Bildirim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
