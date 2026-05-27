/*
  Warnings:

  - You are about to drop the column `vergiNo` on the `Firma` table. All the data in the column will be lost.
  - You are about to drop the column `dosyaUrl` on the `Teklif` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TeklifRedKategori" AS ENUM ('USTMAKAM_ONAY', 'DUSUNUYOR', 'PARA_BEKLIYOR', 'FIYAT_YUKSEK', 'BASKA_FIRMA', 'ULASILAMIYOR', 'DIGER');

-- AlterTable
ALTER TABLE "Firma" DROP COLUMN "vergiNo";

-- AlterTable
ALTER TABLE "Teklif" DROP COLUMN "dosyaUrl",
ADD COLUMN     "odemeAlanId" TEXT,
ADD COLUMN     "odemeAlindiTar" TIMESTAMP(3),
ADD COLUMN     "redKategorisi" "TeklifRedKategori";

-- AddForeignKey
ALTER TABLE "Teklif" ADD CONSTRAINT "Teklif_odemeAlanId_fkey" FOREIGN KEY ("odemeAlanId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
