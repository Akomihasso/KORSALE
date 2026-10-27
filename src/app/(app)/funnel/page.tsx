import Link from "next/link";
import {
  CheckCircle2,
  ClipboardList,
  CircleCheck,
  Clock,
  FileText,
  Hourglass,
  MessageSquare,
  Pause,
  Wallet,
} from "lucide-react";

import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { trTutar } from "@/lib/format";
import { guncelKurlar, gruplariTlyeTopla } from "@/lib/doviz-kuru";
import {
  ARALIK_ETIKET,
  ARALIK_LISTE,
  aralikBaslangic,
  normalizeAralik,
  type Aralik,
} from "@/lib/zaman-araligi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata = { title: "Funnel" };

type SearchParams = Promise<{ aralik?: string }>;

function buildHref(aralik: Aralik) {
  return aralik === "AY" ? "/funnel" : `/funnel?aralik=${aralik}`;
}

function aralikEki(aralik: Aralik): string {
  return aralik === "AY" ? "" : `&aralik=${aralik}`;
}

function soloEki(aralik: Aralik): string {
  return aralik === "AY" ? "" : `?aralik=${aralik}`;
}

export default async function FunnelPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAuth();
  const { aralik } = await searchParams;
  const aktifAralik: Aralik = normalizeAralik(aralik);
  const baslangic = aralikBaslangic(aktifAralik);

  // Her metrik kendi tarih kolonundan filtrelenir — dashboard ile birebir uyumlu.
  const tarihGorusme = baslangic ? { tarih: { gte: baslangic } } : {};
  const tarihCreated = baslangic ? { createdAt: { gte: baslangic } } : {};
  const tarihKabul = baslangic ? { kabulTar: { gte: baslangic } } : {};
  const tarihOdeme = baslangic ? { odemeAlindiTar: { gte: baslangic } } : {};

  const [
    gorusmeSayisi,
    gorusmeTahminAgg,
    teklifToplamSayisi,
    teklifToplamGruplar,
    teklifOnayBekleyenSayisi,
    teklifOnayBekleyenGruplar,
    teklifOdemeBekleyenSayisi,
    teklifOdemeBekleyenGruplar,
    teklifParaAlindiSayisi,
    teklifParaAlindiGruplar,
    operasyonToplamSayisi,
    operasyonBekleyenSayisi,
    operasyonIslemdeSayisi,
    operasyonTamamlandiSayisi,
    kurlar,
  ] = await Promise.all([
    prisma.gorusme.count({ where: tarihGorusme }),
    prisma.gorusme.aggregate({
      _sum: { tahminiTutar: true },
      where: tarihGorusme,
    }),
    prisma.teklif.count({ where: tarihCreated }),
    prisma.teklif.groupBy({
      by: ["paraBirimi"],
      _sum: { netTutar: true },
      where: tarihCreated,
    }),
    prisma.teklif.count({
      where: { durum: { in: ["GONDERILDI", "BEKLEMEDE"] }, ...tarihCreated },
    }),
    prisma.teklif.groupBy({
      by: ["paraBirimi"],
      _sum: { netTutar: true },
      where: { durum: { in: ["GONDERILDI", "BEKLEMEDE"] }, ...tarihCreated },
    }),
    prisma.teklif.count({
      where: { durum: "KABUL", odemeAlindiTar: null, ...tarihKabul },
    }),
    prisma.teklif.groupBy({
      by: ["paraBirimi"],
      _sum: { netTutar: true },
      where: { durum: "KABUL", odemeAlindiTar: null, ...tarihKabul },
    }),
    prisma.teklif.count({
      where: { durum: "KABUL", odemeAlindiTar: { not: null }, ...tarihOdeme },
    }),
    prisma.teklif.groupBy({
      by: ["paraBirimi"],
      _sum: { netTutar: true },
      where: { durum: "KABUL", odemeAlindiTar: { not: null }, ...tarihOdeme },
    }),
    prisma.operasyon.count({ where: tarihCreated }),
    prisma.operasyon.count({ where: { durum: "BEKLIYOR", ...tarihCreated } }),
    prisma.operasyon.count({
      where: { durum: { in: ["DEVAM_EDIYOR", "ASKIDA"] }, ...tarihCreated },
    }),
    prisma.operasyon.count({
      where: { durum: "TAMAMLANDI", ...tarihCreated },
    }),
    guncelKurlar(),
  ]);

  const teklifToplamCiro = gruplariTlyeTopla(teklifToplamGruplar, kurlar);
  const teklifOnayBekleyenCiro = gruplariTlyeTopla(
    teklifOnayBekleyenGruplar,
    kurlar,
  );
  const teklifOdemeBekleyenCiro = gruplariTlyeTopla(
    teklifOdemeBekleyenGruplar,
    kurlar,
  );
  const teklifParaAlindiCiro = gruplariTlyeTopla(
    teklifParaAlindiGruplar,
    kurlar,
  );
  const gorusmeTahminTutar = Number(gorusmeTahminAgg._sum.tahminiTutar ?? 0);

  const donusumGorusmeTeklif =
    gorusmeSayisi > 0
      ? Math.round((teklifToplamSayisi / gorusmeSayisi) * 100)
      : null;
  const donusumTeklifOperasyon =
    teklifToplamSayisi > 0
      ? Math.round((operasyonToplamSayisi / teklifToplamSayisi) * 100)
      : null;

  const teklifDigerSayisi = Math.max(
    0,
    teklifToplamSayisi -
      teklifOnayBekleyenSayisi -
      teklifOdemeBekleyenSayisi -
      teklifParaAlindiSayisi,
  );
  const operasyonDigerSayisi = Math.max(
    0,
    operasyonToplamSayisi -
      operasyonBekleyenSayisi -
      operasyonIslemdeSayisi -
      operasyonTamamlandiSayisi,
  );

  // --- Funnel geometrisi -----------------------------------------------------
  // En büyük sayı 100% genişliğe karşılık. Her katmanın üst/alt kenarı buna göre.
  // Minimum görünürlük: 0.22 (bir sayı 0 olsa bile tamamen kaybolmasın).
  const enBuyuk = Math.max(
    gorusmeSayisi,
    teklifToplamSayisi,
    operasyonToplamSayisi,
    1,
  );
  const minW = 0.22;
  const wTeklif = Math.max(minW, teklifToplamSayisi / enBuyuk);
  const wOperasyon = Math.max(minW, operasyonToplamSayisi / enBuyuk);
  const wCikis = Math.max(0.12, wOperasyon * 0.65);

  // Zarko'nun kararları (2026-10-27):
  // - Teklifler trapezi KLASİK yönde (üstü geniş, altı dar — diğerleriyle aynı) +
  //   genel %20 daha dar + yüksekliği %25 daha fazla.
  // - Operasyonlar trapezi genel %35 daha dar.
  const TEKLIF_DARALT = 0.8;
  const OPERASYON_DARALT = 0.65;

  const gorusmeKatman: KatmanGeometri = {
    id: "gorusme",
    baslik: "Görüşmeler",
    sayi: gorusmeSayisi,
    tutar: gorusmeTahminTutar || null,
    ustOran: 1,
    altOran: wTeklif,
    yukseklik: 130,
    renk: "#0ea5e9", // sky-500
    href: `/gorusmeler${soloEki(aktifAralik)}`,
  };

  // Teklif KLASİK yön: üst geniş, alt dar (diğer katmanlarla aynı yön)
  const teklifKatman: KatmanGeometri = {
    id: "teklif",
    baslik: "Teklifler",
    sayi: teklifToplamSayisi,
    tutar: teklifToplamCiro || null,
    ustOran: wTeklif * TEKLIF_DARALT,
    altOran: wOperasyon * TEKLIF_DARALT,
    yukseklik: Math.round(130 * 1.25), // %25 daha yüksek
    renk: "#c2410c", // orange-700
    href: `/teklifler${soloEki(aktifAralik)}`,
    dilimler: [
      {
        etiket: "Onay bekleyen",
        sayi: teklifOnayBekleyenSayisi,
        renk: "#f97316",
      },
      {
        etiket: "Onaylanan · Ödeme bekliyor",
        sayi: teklifOdemeBekleyenSayisi,
        renk: "#ea580c",
      },
      {
        etiket: "Onaylanan · Ödemesi gelen",
        sayi: teklifParaAlindiSayisi,
        renk: "#9a3412",
      },
      {
        etiket: "Reddedilen · İptal · Taslak",
        sayi: teklifDigerSayisi,
        renk: "#78716c",
      },
    ],
  };

  const operasyonKatman: KatmanGeometri = {
    id: "operasyon",
    baslik: "Operasyonlar",
    sayi: operasyonToplamSayisi,
    tutar: null,
    ustOran: wOperasyon * OPERASYON_DARALT,
    altOran: wCikis * OPERASYON_DARALT,
    yukseklik: 130,
    renk: "#15803d",
    href: `/operasyonlar${soloEki(aktifAralik)}`,
    dilimler: [
      { etiket: "Bekleyen", sayi: operasyonBekleyenSayisi, renk: "#22c55e" },
      { etiket: "İşlemde", sayi: operasyonIslemdeSayisi, renk: "#16a34a" },
      {
        etiket: "Tamamlanan",
        sayi: operasyonTamamlandiSayisi,
        renk: "#166534",
      },
      { etiket: "İptal", sayi: operasyonDigerSayisi, renk: "#78716c" },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Funnel</h1>
          <p className="text-sm text-muted-foreground">
            Satış hunisinin{" "}
            {ARALIK_ETIKET[aktifAralik].toLocaleLowerCase("tr")} görünümü
          </p>
        </div>
        <Tabs value={aktifAralik}>
          <TabsList>
            {ARALIK_LISTE.map((a) => (
              <TabsTrigger key={a} value={a} render={<Link href={buildHref(a)} />}>
                {ARALIK_ETIKET[a]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Grid: 3 ana katman satırı + 2 dönüşüm rozeti satırı.
          Her ana satırda sol SVG trapez + sağ detay kartı dikey olarak hizalı. */}
      <div className="grid gap-3 lg:grid-cols-5">
        {/* Satır: Görüşmeler */}
        <div className="lg:col-span-3">
          <TekKatmanSVG katman={gorusmeKatman} />
        </div>
        <div className="lg:col-span-2">
          <KatmanDetay
            baslik="Görüşmeler"
            icon={MessageSquare}
            sayi={gorusmeSayisi}
            tutar={gorusmeTahminTutar || null}
            href={`/gorusmeler${soloEki(aktifAralik)}`}
            aciklama="Yapılan tüm görüşmeler (tahmini TL)"
            vurgu="text-sky-700 dark:text-sky-400"
          />
        </div>

        {/* Dönüşüm rozeti — Görüşme → Teklif */}
        <div className="flex items-center justify-center py-1 lg:col-span-3">
          <DonusumRozeti oran={donusumGorusmeTeklif} metin="Görüşme → Teklif" />
        </div>
        <div className="hidden lg:col-span-2 lg:block" />

        {/* Satır: Teklifler */}
        <div className="lg:col-span-3">
          <TekKatmanSVG katman={teklifKatman} />
        </div>
        <div className="lg:col-span-2">
          <KatmanDetay
            baslik="Teklifler"
            icon={FileText}
            sayi={teklifToplamSayisi}
            tutar={teklifToplamCiro || null}
            href={`/teklifler${soloEki(aktifAralik)}`}
            aciklama="Oluşturulmuş tüm teklifler (TL)"
            vurgu="text-orange-700 dark:text-orange-400"
            dilimler={[
              {
                etiket: "Onay bekleyen",
                sayi: teklifOnayBekleyenSayisi,
                tutar: teklifOnayBekleyenCiro,
                renk: "bg-orange-500",
                href: `/teklifler?grup=BEKLIYOR${aralikEki(aktifAralik)}`,
                icon: Hourglass,
              },
              {
                etiket: "Onaylanan · Ödeme bekliyor",
                sayi: teklifOdemeBekleyenSayisi,
                tutar: teklifOdemeBekleyenCiro,
                renk: "bg-orange-600",
                href: `/teklifler?grup=ONAYLANDI${aralikEki(aktifAralik)}`,
                icon: CircleCheck,
              },
              {
                etiket: "Onaylanan · Ödemesi gelen",
                sayi: teklifParaAlindiSayisi,
                tutar: teklifParaAlindiCiro,
                renk: "bg-orange-800",
                href: `/teklifler?grup=PARA_ALINDI${aralikEki(aktifAralik)}`,
                icon: Wallet,
              },
            ]}
            digerSayisi={teklifDigerSayisi}
            digerEtiket="Reddedilen / İptal / Taslak"
            digerHref={`/teklifler${soloEki(aktifAralik)}`}
          />
        </div>

        {/* Dönüşüm rozeti — Teklif → Operasyon */}
        <div className="flex items-center justify-center py-1 lg:col-span-3">
          <DonusumRozeti
            oran={donusumTeklifOperasyon}
            metin="Teklif → Operasyon"
          />
        </div>
        <div className="hidden lg:col-span-2 lg:block" />

        {/* Satır: Operasyonlar */}
        <div className="lg:col-span-3">
          <TekKatmanSVG katman={operasyonKatman} />
        </div>
        <div className="lg:col-span-2">
          <KatmanDetay
            baslik="Operasyonlar"
            icon={ClipboardList}
            sayi={operasyonToplamSayisi}
            tutar={null}
            href={`/operasyonlar${soloEki(aktifAralik)}`}
            aciklama="Para gelen tekliflerden açılan dosyalar"
            vurgu="text-green-700 dark:text-green-400"
            dilimler={[
              {
                etiket: "Bekleyen",
                sayi: operasyonBekleyenSayisi,
                tutar: null,
                renk: "bg-green-500",
                href: `/operasyonlar?durum=BEKLIYOR${aralikEki(aktifAralik)}`,
                icon: Clock,
              },
              {
                etiket: "İşlemde",
                sayi: operasyonIslemdeSayisi,
                tutar: null,
                renk: "bg-green-600",
                href: `/operasyonlar?durum=islemde${aralikEki(aktifAralik)}`,
                icon: Pause,
              },
              {
                etiket: "Tamamlanan",
                sayi: operasyonTamamlandiSayisi,
                tutar: null,
                renk: "bg-green-800",
                href: `/operasyonlar?durum=TAMAMLANDI${aralikEki(aktifAralik)}`,
                icon: CheckCircle2,
              },
            ]}
            digerSayisi={operasyonDigerSayisi}
            digerEtiket="İptal"
            digerHref={`/operasyonlar?durum=IPTAL${aralikEki(aktifAralik)}`}
          />
        </div>
      </div>
    </div>
  );
}

// --- Tipler ----------------------------------------------------------------

type IcDilim = {
  etiket: string;
  sayi: number;
  renk: string;
};

type KatmanGeometri = {
  id: string;
  baslik: string;
  sayi: number;
  tutar: number | null;
  ustOran: number; // 0..1
  altOran: number; // 0..1
  yukseklik: number; // px (viewBox)
  renk: string;
  href: string;
  dilimler?: IcDilim[];
};

// --- Tek katman SVG --------------------------------------------------------

function TekKatmanSVG({ katman }: { katman: KatmanGeometri }) {
  const W = 600;
  const H = katman.yukseklik;

  const ustW = katman.ustOran * W;
  const altW = katman.altOran * W;
  const xUstSol = (W - ustW) / 2;
  const xUstSag = xUstSol + ustW;
  const xAltSol = (W - altW) / 2;
  const xAltSag = xAltSol + altW;

  const path = `M ${xUstSol} 0 L ${xUstSag} 0 L ${xAltSag} ${H} L ${xAltSol} ${H} Z`;

  const dilimToplam = katman.dilimler
    ? katman.dilimler.reduce((acc, d) => acc + d.sayi, 0)
    : 0;

  const dilimPath: React.ReactNode[] = [];
  if (katman.dilimler && dilimToplam > 0) {
    let t = 0;
    katman.dilimler.forEach((d, i) => {
      if (d.sayi === 0) return;
      const t1 = t;
      const t2 = t + d.sayi / dilimToplam;
      t = t2;

      const yT = t1 * H;
      const yB = t2 * H;
      const wT = ustW + t1 * (altW - ustW);
      const wB = ustW + t2 * (altW - ustW);
      const xT1 = (W - wT) / 2;
      const xT2 = xT1 + wT;
      const xB1 = (W - wB) / 2;
      const xB2 = xB1 + wB;

      dilimPath.push(
        <path
          key={`dilim-${i}`}
          d={`M ${xT1} ${yT} L ${xT2} ${yT} L ${xB2} ${yB} L ${xB1} ${yB} Z`}
          fill={d.renk}
        >
          <title>{`${d.etiket}: ${d.sayi.toLocaleString("tr-TR")}`}</title>
        </path>,
      );
    });
  }

  return (
    <Link href={katman.href} className="block w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full"
        role="img"
        aria-label={katman.baslik}
      >
        {/* İç dilim yoksa tek renk trapez; varsa dilimler ana rengi örter */}
        {dilimPath.length === 0 && <path d={path} fill={katman.renk} />}
        {dilimPath}
        {/* Dış kontur */}
        <path d={path} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={1.5} />
        {/* Metin — merkez */}
        <g pointerEvents="none">
          <text
            x={W / 2}
            y={H / 2 - 14}
            textAnchor="middle"
            className="fill-white text-[13px] font-semibold"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}
          >
            {katman.baslik}
          </text>
          <text
            x={W / 2}
            y={H / 2 + 12}
            textAnchor="middle"
            className="fill-white text-[22px] font-bold tabular-nums"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.45)" }}
          >
            {katman.sayi.toLocaleString("tr-TR")}
          </text>
          {katman.tutar !== null && katman.tutar > 0 && (
            <text
              x={W / 2}
              y={H / 2 + 32}
              textAnchor="middle"
              className="fill-white/90 text-[12px] font-medium tabular-nums"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}
            >
              {trTutar(katman.tutar)}
            </text>
          )}
        </g>
      </svg>
    </Link>
  );
}

// --- Dönüşüm rozeti --------------------------------------------------------

function DonusumRozeti({
  oran,
  metin,
}: {
  oran: number | null;
  metin: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs shadow-sm">
      <span className="text-muted-foreground">{metin}</span>
      <span className="font-semibold text-foreground">
        {oran !== null ? `%${oran}` : "—"}
      </span>
    </div>
  );
}

// --- Yan panel detay kartı -------------------------------------------------

type PanelDilim = {
  etiket: string;
  sayi: number;
  tutar: number | null;
  renk: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

function KatmanDetay({
  baslik,
  icon: Icon,
  sayi,
  tutar,
  href,
  aciklama,
  vurgu,
  dilimler,
  digerSayisi,
  digerEtiket,
  digerHref,
}: {
  baslik: string;
  icon: React.ComponentType<{ className?: string }>;
  sayi: number;
  tutar: number | null;
  href: string;
  aciklama?: string;
  vurgu?: string;
  dilimler?: PanelDilim[];
  digerSayisi?: number;
  digerEtiket?: string;
  digerHref?: string;
}) {
  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <Link href={href} className="flex items-center gap-2 hover:underline">
            <Icon className={`size-4 ${vurgu ?? "text-muted-foreground"}`} />
            <CardTitle className="text-sm">{baslik}</CardTitle>
          </Link>
          <div className="text-right">
            <div className={`text-xl font-bold tabular-nums ${vurgu ?? ""}`}>
              {sayi.toLocaleString("tr-TR")}
            </div>
            {tutar !== null && tutar > 0 && (
              <div className="text-xs font-medium tabular-nums text-muted-foreground">
                {trTutar(tutar)}
              </div>
            )}
          </div>
        </div>
        {aciklama && (
          <CardDescription className="text-[11px]">{aciklama}</CardDescription>
        )}
      </CardHeader>
      {dilimler && dilimler.length > 0 && (
        <CardContent className="space-y-1 pt-0">
          {dilimler.map((d) => {
            const DIcon = d.icon;
            const oran = sayi > 0 ? Math.round((d.sayi / sayi) * 100) : 0;
            return (
              <Link
                key={d.etiket}
                href={d.href}
                className="flex items-center justify-between gap-2 rounded-md border bg-background px-2 py-1.5 text-xs transition-colors hover:bg-muted/60"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={`inline-block size-2 shrink-0 rounded-full ${d.renk}`}
                  />
                  <DIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium">{d.etiket}</span>
                  <Badge
                    variant="outline"
                    className="h-4 shrink-0 px-1 text-[9px]"
                  >
                    %{oran}
                  </Badge>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-right">
                  <span className="font-semibold tabular-nums">
                    {d.sayi.toLocaleString("tr-TR")}
                  </span>
                  {d.tutar !== null && d.tutar > 0 && (
                    <span className="w-24 text-[11px] text-muted-foreground tabular-nums">
                      {trTutar(d.tutar)}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
          {(digerSayisi ?? 0) > 0 && digerEtiket && digerHref && (
            <Link
              href={digerHref}
              className="flex items-center justify-between gap-2 rounded-md border bg-background/40 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted/60"
            >
              <div className="flex items-center gap-2">
                <span className="inline-block size-2 rounded-full bg-stone-500" />
                <span>{digerEtiket}</span>
              </div>
              <span className="tabular-nums">
                {digerSayisi!.toLocaleString("tr-TR")}
              </span>
            </Link>
          )}
        </CardContent>
      )}
    </Card>
  );
}
