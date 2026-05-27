import { prisma } from "@/lib/prisma";
import type { BelgeTipi } from "@prisma/client";

const TIP_PREFIX: Record<BelgeTipi, string> = {
  TEKLIF: "TKL",
  TALIMAT: "TLM",
  SOZLESME: "SZL",
};

/**
 * Yıl bazlı sıralı belge numarası üretir. Örn: TKL-2026-0001
 * Aynı tipte mevcut en yüksek numarayı bulup +1 ile döndürür.
 */
export async function belgeNoUret(tip: BelgeTipi): Promise<string> {
  const prefix = TIP_PREFIX[tip];
  const yil = new Date().getFullYear();
  const onek = `${prefix}-${yil}-`;

  const sonuncu = await prisma.teklif.findFirst({
    where: { belgeTipi: tip, belgeNo: { startsWith: onek } },
    orderBy: { belgeNo: "desc" },
    select: { belgeNo: true },
  });

  let sira = 1;
  if (sonuncu) {
    const sonuncuSira = Number(sonuncu.belgeNo.slice(onek.length));
    if (Number.isFinite(sonuncuSira)) sira = sonuncuSira + 1;
  }

  return `${onek}${String(sira).padStart(4, "0")}`;
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
