import { prisma } from "@/lib/prisma";
import { guncelKurlar, tlyeCevir } from "@/lib/doviz-kuru";
import {
  GORUSME_SONUC_ETIKET,
  GORUSME_TIPI_ETIKET,
  BELGE_TIPI_ETIKET,
  TEKLIF_ASAMA_ETIKET,
  teklifAsamasi,
  OPERASYON_DURUM_ETIKET,
  OPERASYON_KATEGORI_ETIKET,
} from "@/lib/format";

// Türkiye sabit UTC+3 (yaz saati uygulaması yok). Vercel UTC çalıştığı için
// "01.06.2026 günü TR saatinde" = UTC 31.05.2026 21:00 — 01.06.2026 20:59:59.999.
const TR_OFFSET_MS = 3 * 60 * 60 * 1000;

export function trGunBasi(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) - TR_OFFSET_MS);
}

export function trGunSonu(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999) - TR_OFFSET_MS);
}

export type RaporTipi = "gorusme" | "teklif" | "operasyon" | "ekip";

export const RAPOR_BASLIK: Record<RaporTipi, string> = {
  gorusme: "Görüşmeler",
  teklif: "Teklif / Talimat / Sözleşme",
  operasyon: "Operasyonlar",
  ekip: "Ekip Performansı",
};

export type Rapor = {
  tip: RaporTipi;
  baslik: string;
  donem: string; // "01.05.2026 — 01.06.2026"
  sutunlar: string[];
  satirlar: string[][];
  ozet?: { etiket: string; deger: string }[];
};

function trTarih(d: Date | null | undefined): string {
  if (!d) return "—";
  const x = new Date(d);
  return `${String(x.getDate()).padStart(2, "0")}.${String(x.getMonth() + 1).padStart(2, "0")}.${x.getFullYear()}`;
}

function trPara(n: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function gunFarki(a: Date | null, b: Date | null): string {
  if (!a || !b) return "—";
  const fark = Math.max(0, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
  return `${fark} gün`;
}

export async function raporUret(
  tip: RaporTipi,
  baslangic: Date,
  bitis: Date,
): Promise<Rapor> {
  const donem = `${trTarih(baslangic)} — ${trTarih(bitis)}`;

  switch (tip) {
    case "gorusme": {
      const kayitlar = await prisma.gorusme.findMany({
        where: { tarih: { gte: baslangic, lte: bitis } },
        orderBy: { tarih: "desc" },
        include: {
          firma: { select: { ad: true } },
          sorumlu: { select: { name: true } },
        },
      });
      const satirlar = kayitlar.map((g) => [
        trTarih(g.tarih),
        g.firma.ad,
        g.konu,
        GORUSME_TIPI_ETIKET[g.tip],
        GORUSME_SONUC_ETIKET[g.sonuc],
        g.sorumlu.name,
        g.tahminiTutar ? trPara(Number(g.tahminiTutar)) : "—",
      ]);
      return {
        tip,
        baslik: RAPOR_BASLIK[tip],
        donem,
        sutunlar: ["Tarih", "Firma", "Konu", "Tip", "Sonuç", "Sorumlu", "Tahmini Tutar"],
        satirlar,
        ozet: [{ etiket: "Toplam görüşme", deger: String(kayitlar.length) }],
      };
    }

    case "teklif": {
      const [kayitlar, kurlar] = await Promise.all([
        prisma.teklif.findMany({
          where: { createdAt: { gte: baslangic, lte: bitis } },
          orderBy: { createdAt: "desc" },
          include: {
            firma: { select: { ad: true } },
            sorumlu: { select: { name: true } },
          },
        }),
        guncelKurlar(),
      ]);
      let toplamTl = 0;
      const satirlar = kayitlar.map((t) => {
        const net = Number(t.netTutar);
        const tl = tlyeCevir(net, t.paraBirimi, kurlar);
        toplamTl += tl;
        return [
          t.belgeNo,
          BELGE_TIPI_ETIKET[t.belgeTipi],
          trTarih(t.createdAt),
          t.firma.ad,
          t.baslik,
          t.sorumlu.name,
          TEKLIF_ASAMA_ETIKET[
            teklifAsamasi({
              durum: t.durum,
              odemeAlindiTar: t.odemeAlindiTar,
            })
          ],
          `${trPara(net)} ${t.paraBirimi}`,
          trPara(tl),
        ];
      });
      return {
        tip,
        baslik: RAPOR_BASLIK[tip],
        donem,
        sutunlar: [
          "Belge No",
          "Tip",
          "Tarih",
          "Firma",
          "Başlık",
          "Sorumlu",
          "Durum",
          "Tutar",
          "TL Karşılığı",
        ],
        satirlar,
        ozet: [
          { etiket: "Toplam kayıt", deger: String(kayitlar.length) },
          { etiket: "Toplam TL karşılığı", deger: trPara(toplamTl) },
        ],
      };
    }

    case "operasyon": {
      const kayitlar = await prisma.operasyon.findMany({
        where: { createdAt: { gte: baslangic, lte: bitis } },
        orderBy: { createdAt: "desc" },
        include: {
          sorumlu: { select: { name: true } },
          teklif: {
            select: {
              belgeNo: true,
              baslik: true,
              firma: { select: { ad: true } },
            },
          },
        },
      });
      const satirlar = kayitlar.map((o) => [
        o.belgeNo ?? "—",
        o.teklif.belgeNo,
        OPERASYON_KATEGORI_ETIKET[o.kategori],
        o.teklif.firma.ad,
        o.teklif.baslik,
        o.sorumlu.name,
        OPERASYON_DURUM_ETIKET[o.durum],
        trTarih(o.createdAt),
        trTarih(o.bitisTar),
        gunFarki(o.createdAt, o.bitisTar),
      ]);
      return {
        tip,
        baslik: RAPOR_BASLIK[tip],
        donem,
        sutunlar: [
          "Op. No",
          "Teklif No",
          "Kategori",
          "Firma",
          "İş",
          "Sorumlu",
          "Durum",
          "Atama",
          "Bitiş",
          "Süre",
        ],
        satirlar,
        ozet: [{ etiket: "Toplam operasyon", deger: String(kayitlar.length) }],
      };
    }

    case "ekip": {
      const [kullanicilar, kurlar] = await Promise.all([
        prisma.user.findMany({
          where: { isActive: true },
          orderBy: { name: "asc" },
          select: { id: true, name: true, role: true },
        }),
        guncelKurlar(),
      ]);

      const tarihFiltre = { gte: baslangic, lte: bitis };
      const satirlar: string[][] = [];
      for (const u of kullanicilar) {
        const [gorusmeSayi, teklifSayi, kazanilanGruplar, opTamSayi, opAktifSayi] =
          await Promise.all([
            prisma.gorusme.count({
              where: { sorumluId: u.id, tarih: tarihFiltre },
            }),
            prisma.teklif.count({
              where: { sorumluId: u.id, createdAt: tarihFiltre },
            }),
            prisma.teklif.groupBy({
              by: ["paraBirimi"],
              _sum: { netTutar: true },
              where: {
                sorumluId: u.id,
                durum: "KABUL",
                kabulTar: tarihFiltre,
              },
            }),
            prisma.operasyon.count({
              where: {
                sorumluId: u.id,
                durum: "TAMAMLANDI",
                bitisTar: tarihFiltre,
              },
            }),
            prisma.operasyon.count({
              where: {
                sorumluId: u.id,
                durum: { in: ["BEKLIYOR", "DEVAM_EDIYOR", "ASKIDA"] },
              },
            }),
          ]);

        let kazanilanTl = 0;
        for (const g of kazanilanGruplar) {
          kazanilanTl += tlyeCevir(
            Number(g._sum.netTutar ?? 0),
            g.paraBirimi,
            kurlar,
          );
        }

        satirlar.push([
          u.name,
          u.role,
          String(gorusmeSayi),
          String(teklifSayi),
          String(opTamSayi),
          String(opAktifSayi),
          trPara(kazanilanTl),
        ]);
      }

      return {
        tip,
        baslik: RAPOR_BASLIK[tip],
        donem,
        sutunlar: [
          "Ekip Üyesi",
          "Rol",
          "Görüşme",
          "Teklif",
          "Tamamlanan Op.",
          "Aktif Op.",
          "Kazanılan (TL)",
        ],
        satirlar,
      };
    }
  }
}
