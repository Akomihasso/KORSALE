-- CreateEnum
CREATE TYPE "BelgeSayacTipi" AS ENUM ('TEKLIF', 'TALIMAT', 'SOZLESME', 'OPERASYON');

-- AlterTable
ALTER TABLE "Operasyon" ADD COLUMN "belgeNo" TEXT;

-- CreateTable
CREATE TABLE "BelgeSayac" (
    "tip" "BelgeSayacTipi" NOT NULL,
    "yil" INTEGER NOT NULL,
    "sonNumara" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BelgeSayac_pkey" PRIMARY KEY ("tip","yil")
);

-- CreateIndex
CREATE UNIQUE INDEX "Operasyon_belgeNo_key" ON "Operasyon"("belgeNo");

-- 2026 için sayaç başlangıcı (200 → ilk yeni numara 0201)
INSERT INTO "BelgeSayac" ("tip", "yil", "sonNumara", "updatedAt") VALUES
    ('TEKLIF',    2026, 200, NOW()),
    ('TALIMAT',   2026, 200, NOW()),
    ('SOZLESME',  2026, 200, NOW()),
    ('OPERASYON', 2026, 200, NOW());
