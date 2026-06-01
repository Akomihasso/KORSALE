import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Belge sayaç tipi.
 * Teklif modelindeki BelgeTipi enum'una OPERASYON eklenmiş hali.
 */
export type BelgeSayacTipi = "TEKLIF" | "TALIMAT" | "SOZLESME" | "OPERASYON";

const PREFIX: Record<BelgeSayacTipi, string> = {
  TEKLIF: "KP",
  TALIMAT: "KT",
  SOZLESME: "KS",
  OPERASYON: "KO",
};

type PrismaLike = Prisma.TransactionClient | typeof prisma;

/**
 * Belge numarası üretimi.
 *
 * Format: <PREFIX><YY><SIRA4>  → örn: KP260201
 *   - PREFIX: TEKLIF=KP, TALIMAT=KT, SOZLESME=KS, OPERASYON=KO
 *   - YY: yılın son 2 hanesi
 *   - SIRA4: 4 haneli sıfır dolgulu sıra numarası
 *
 * Atomic: tek bir UPSERT + RETURNING. 2026 sayacı seed ile 200'den başlar
 * (ilk yeni numara KP260201). 2027+ için sayaç 0'dan başlar (ilk numara KP270001).
 *
 * Transaction içinde kullanmak için ikinci parametre olarak tx geçilebilir.
 */
export async function belgeNoUret(
  tip: BelgeSayacTipi,
  db: PrismaLike = prisma,
  tarih: Date = new Date(),
): Promise<string> {
  const yil = tarih.getFullYear();

  const rows = await db.$queryRaw<{ sonNumara: number }[]>`
    INSERT INTO "BelgeSayac" ("tip", "yil", "sonNumara", "updatedAt")
    VALUES (${tip}::"BelgeSayacTipi", ${yil}, 1, NOW())
    ON CONFLICT ("tip", "yil") DO UPDATE
    SET "sonNumara" = "BelgeSayac"."sonNumara" + 1,
        "updatedAt" = NOW()
    RETURNING "sonNumara"
  `;

  const sira = rows[0].sonNumara;
  const yy = String(yil % 100).padStart(2, "0");
  const seq = String(sira).padStart(4, "0");

  return `${PREFIX[tip]}${yy}${seq}`;
}

const AYAR_INDIRIM_ONAY_YUZDE = "indirim_onay_yuzde";
const VARSAYILAN_INDIRIM_ONAY_YUZDE = 15;

export async function indirimOnayYuzdesi(): Promise<number> {
  const ayar = await prisma.ayar.findUnique({
    where: { anahtar: AYAR_INDIRIM_ONAY_YUZDE },
  });
  if (!ayar) return VARSAYILAN_INDIRIM_ONAY_YUZDE;
  const n = Number(ayar.deger);
  return Number.isFinite(n) ? n : VARSAYILAN_INDIRIM_ONAY_YUZDE;
}

/**
 * indirimYuzde verildiyse net tutarı hesaplar, aksi halde tutarı döndürür.
 */
export function netTutarHesapla(tutar: number, indirimYuzde?: number | null): number {
  if (!indirimYuzde || indirimYuzde <= 0) return tutar;
  const net = tutar * (1 - indirimYuzde / 100);
  return Math.round(net * 100) / 100;
}
