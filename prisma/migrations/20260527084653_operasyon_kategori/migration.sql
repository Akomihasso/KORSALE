-- CreateEnum
CREATE TYPE "OperasyonKategori" AS ENUM ('MARKA', 'PATENT', 'TASARIM', 'DANISMANLIK', 'DIGER');

-- AlterTable
ALTER TABLE "Operasyon" ADD COLUMN     "kategori" "OperasyonKategori" NOT NULL DEFAULT 'DIGER';

-- CreateIndex
CREATE INDEX "Operasyon_kategori_idx" ON "Operasyon"("kategori");

-- CreateIndex
CREATE INDEX "Operasyon_durum_idx" ON "Operasyon"("durum");
