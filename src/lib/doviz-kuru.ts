import { prisma } from "@/lib/prisma";

/**
 * TCMB döviz kuru entegrasyonu.
 *
 * Kur kaynağı: https://www.tcmb.gov.tr/kurlar/today.xml
 * - Günde 1-2 kez güncellenir (hafta içi ~15:30)
 * - ForexSelling alanı standart "döviz satış" kuru olarak kullanılır
 *
 * Cache: Ayar tablosunda `kur_<KOD>` ve `kur_tarih` saklanır.
 * 24 saatte bir yeniden çekilir; servis erişilemezse son cache değer kullanılır.
 *
 * TRY için kur = 1.
 */

export const DESTEKLENEN_PARA_BIRIMLERI = ["TRY", "USD", "EUR", "GBP"] as const;
export type ParaBirimi = (typeof DESTEKLENEN_PARA_BIRIMLERI)[number];

export const PARA_BIRIMI_ETIKET: Record<ParaBirimi, string> = {
  TRY: "₺ TL",
  USD: "$ Dolar",
  EUR: "€ Euro",
  GBP: "£ Sterlin",
};

const VARSAYILAN_KURLAR: Record<ParaBirimi, number> = {
  TRY: 1,
  USD: 34,
  EUR: 37,
  GBP: 43,
};

const CACHE_GECERLILIK_MS = 24 * 60 * 60 * 1000; // 24 saat

function ayarAnahtari(kod: ParaBirimi) {
  return `kur_${kod}`;
}

async function tcmbXmlCek(): Promise<string | null> {
  try {
    const res = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml", {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function xmldenForexSellingAl(xml: string, kod: string): number | null {
  // <Currency ... Kod="USD" ...> ... <ForexSelling>34.5678</ForexSelling> ... </Currency>
  const re = new RegExp(
    `<Currency[^>]*Kod="${kod}"[^>]*>[\\s\\S]*?<ForexSelling>([\\d.]+)</ForexSelling>`,
    "i",
  );
  const m = xml.match(re);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function cacheKurlariYaz(kurlar: Record<string, number>): Promise<void> {
  const simdi = new Date().toISOString();
  await prisma.$transaction([
    ...Object.entries(kurlar).map(([kod, kur]) =>
      prisma.ayar.upsert({
        where: { anahtar: ayarAnahtari(kod as ParaBirimi) },
        update: { deger: String(kur) },
        create: { anahtar: ayarAnahtari(kod as ParaBirimi), deger: String(kur) },
      }),
    ),
    prisma.ayar.upsert({
      where: { anahtar: "kur_tarih" },
      update: { deger: simdi },
      create: { anahtar: "kur_tarih", deger: simdi },
    }),
  ]);
}

async function cachedenKurlariOku(): Promise<Record<ParaBirimi, number>> {
  const ayarlar = await prisma.ayar.findMany({
    where: {
      anahtar: { in: DESTEKLENEN_PARA_BIRIMLERI.map((k) => ayarAnahtari(k)) },
    },
  });
  const map: Record<ParaBirimi, number> = { ...VARSAYILAN_KURLAR };
  for (const a of ayarlar) {
    const kod = a.anahtar.replace("kur_", "") as ParaBirimi;
    const n = Number(a.deger);
    if (Number.isFinite(n) && n > 0) map[kod] = n;
  }
  map.TRY = 1;
  return map;
}

async function cacheGuncelMi(): Promise<boolean> {
  const tarih = await prisma.ayar.findUnique({ where: { anahtar: "kur_tarih" } });
  if (!tarih) return false;
  const t = new Date(tarih.deger).getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() - t < CACHE_GECERLILIK_MS;
}

/**
 * Tüm desteklenen para birimleri için TRY'ye çevirme katsayılarını döndürür.
 * Cache 24 saatten eski ise TCMB'den taze çeker; servis erişilemezse cache değeri korunur.
 */
export async function guncelKurlar(): Promise<Record<ParaBirimi, number>> {
  if (await cacheGuncelMi()) {
    return cachedenKurlariOku();
  }

  const xml = await tcmbXmlCek();
  if (xml) {
    const yeni: Record<string, number> = { TRY: 1 };
    for (const kod of DESTEKLENEN_PARA_BIRIMLERI) {
      if (kod === "TRY") continue;
      const k = xmldenForexSellingAl(xml, kod);
      if (k) yeni[kod] = k;
    }
    if (Object.keys(yeni).length > 1) {
      await cacheKurlariYaz(yeni);
      return cachedenKurlariOku();
    }
  }

  // TCMB ulaşılamadı → eski cache'i veya varsayılanı dön
  return cachedenKurlariOku();
}

/**
 * Verilen tutarı kaynak para biriminden TRY'ye çevirir.
 * Senkron kullanım için önce `guncelKurlar()` çağrılıp sonuç saklanmalıdır.
 */
export function tlyeCevir(
  tutar: number,
  paraBirimi: string,
  kurlar: Record<ParaBirimi, number>,
): number {
  if (!Number.isFinite(tutar)) return 0;
  const kod = (paraBirimi || "TRY").toUpperCase() as ParaBirimi;
  const kur = kurlar[kod] ?? kurlar.TRY;
  return Math.round(tutar * kur * 100) / 100;
}

/**
 * Teklif tarafı için "para birimi gruplandırılmış toplam" → tek TRY rakamına çevirir.
 *
 * Kullanımı:
 *   const gruplar = await prisma.teklif.groupBy({
 *     by: ["paraBirimi"],
 *     _sum: { netTutar: true },
 *     where: { ... },
 *   });
 *   const tl = gruplariTlyeTopla(gruplar, kurlar);
 */
export function gruplariTlyeTopla(
  gruplar: Array<{ paraBirimi: string; _sum: { netTutar: unknown } }>,
  kurlar: Record<ParaBirimi, number>,
): number {
  let toplam = 0;
  for (const g of gruplar) {
    const tutar = Number(g._sum.netTutar ?? 0);
    if (!Number.isFinite(tutar)) continue;
    toplam += tlyeCevir(tutar, g.paraBirimi, kurlar);
  }
  return Math.round(toplam * 100) / 100;
}
