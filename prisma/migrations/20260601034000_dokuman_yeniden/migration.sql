-- KORSİSTEM doküman yönetimi için Dokuman tablosu yeniden tasarlandı.
-- Eski tablo henüz hiç kullanılmadığı için DROP + CREATE yapılıyor.

-- DropTable
DROP TABLE IF EXISTS "Dokuman";

-- DropEnum
DROP TYPE IF EXISTS "DokumanTipi";

-- CreateEnum
CREATE TYPE "DokumanKategori" AS ENUM (
    'YONETMELIK_TALIMAT',
    'SISTEM_TARIF',
    'AKIS_SEMASI',
    'YAZISMA_STANDART',
    'TEKLIF_SABLON',
    'TALIMAT_SABLON',
    'SOZLESME_STANDART'
);

-- CreateTable
CREATE TABLE "Dokuman" (
    "id" TEXT NOT NULL,
    "kategori" "DokumanKategori" NOT NULL,
    "kod" TEXT NOT NULL,
    "revizyon" TEXT NOT NULL DEFAULT 'R0',
    "baslik" TEXT NOT NULL,
    "dosyaUrl" TEXT NOT NULL,
    "dosyaTipi" TEXT NOT NULL,
    "dosyaBoyut" INTEGER,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "yukleyenId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dokuman_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Dokuman_kategori_aktif_idx" ON "Dokuman"("kategori", "aktif");
CREATE INDEX "Dokuman_kod_idx" ON "Dokuman"("kod");

-- AddForeignKey
ALTER TABLE "Dokuman" ADD CONSTRAINT "Dokuman_yukleyenId_fkey"
    FOREIGN KEY ("yukleyenId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
