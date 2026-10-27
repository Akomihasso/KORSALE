import Link from "next/link";
import {
  ArrowDown,
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

  // --- Funnel geometrisi: her ana katmanın üst ve alt genişlik oranı
  // En büyük sayı 100% genişliğe karşılık. Katman daraldıkça alt kenar küçülür.
  // Minimum görünürlük için 0.22 (bir sayı 0 olsa bile tamamen kaybolmasın).
  const enBuyuk = Math.max(
    gorusmeSayisi,
    teklifToplamSayisi,
    operasyonToplamSayisi,
    1,
  );
  const minW = 0.22;
  const wTeklif = Math.max(minW, teklifToplamSayisi / enBuyuk);
  const wOperasyon = Math.max(minW, operasyonToplamSayisi / enBuyuk);
  // Son katmanın altı — en dar nokta (nihai çıkış)
  const wCikis = Math.max(0.12, wOperasyon * 0.65);

  const KATMANLAR: KatmanGeometri[] = [
    {
      id: "gorusme",
      baslik: "Görüşmeler",
      sayi: gorusmeSayisi,
      tutar: gorusmeTahminTutar || null,
      ustOran: 1,
      altOran: wTeklif,
      renk: "#0ea5e9", // sky-500
      href: `/gorusmeler${soloEki(aktifAralik)}`,
    },
    {
      id: "teklif",
      baslik: "Teklifler",
      sayi: teklifToplamSayisi,
      tutar: teklifToplamCiro || null,
      ustOran: wTeklif,
      altOran: wOperasyon,
      renk: "#c2410c", // orange-700 (koyu turuncu — PowerPoint'teki orta katmana benzer)
      href: `/teklifler${soloEki(aktifAralik)}`,
      dilimler: [
        {
          etiket: "Onay bekleyen",
          sayi: teklifOnayBekleyenSayisi,
          renk: "#f97316", // orange-500
        },
        {
          etiket: "Onaylanan · Ödeme bekliyor",
          sayi: teklifOdemeBekleyenSayisi,
          renk: "#ea580c", // orange-600
        },
        {
          etiket: "Onaylanan · Ödemesi gelen",
          sayi: teklifParaAlindiSayisi,
          renk: "#9a3412", // orange-800
        },
        {
          etiket: "Reddedilen · İptal · Taslak",
          sayi: teklifDigerSayisi,
          renk: "#78716c", // stone-500
        },
      ],
    },
    {
      id: "operasyon",
      baslik: "Operasyonlar",
      sayi: operasyonToplamSayisi,
      tutar: null,
      ustOran: wOperasyon,
      altOran: wCikis,
      renk: "#15803d", // green-700
      href: `/operasyonlar${soloEki(aktifAralik)}`,
      dilimler: [
        { etiket: "Bekleyen", sayi: operasyonBekleyenSayisi, renk: "#22c55e" }, // green-500
        { etiket: "İşlemde", sayi: operasyonIslemdeSayisi, renk: "#16a34a" }, // green-600
        {
          etiket: "Tamamlanan",
          sayi: operasyonTamamlandiSayisi,
          renk: "#166534", // green-800
        },
        { etiket: "İptal", sayi: operasyonDigerSayisi, renk: "#78716c" },
      ],
    },
  ];

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

      <div className="grid gap-6 lg:grid-cols-5">
        {/* SOL — SVG huni */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Satış Hunisi</CardTitle>
            <CardDescription>
              Her katmanın genişliği kayıt sayısına orantılıdır
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HuniGorsel
              katmanlar={KATMANLAR}
              donusumGorusmeTeklif={donusumGorusmeTeklif}
              donusumTeklifOperasyon={donusumTeklifOperasyon}
            />
          </CardContent>
        </Card>

        {/* SAĞ — Katman detayları */}
        <div className="space-y-3 lg:col-span-2">
          <KatmanDetay
            baslik="Görüşmeler"
            icon={MessageSquare}
            sayi={gorusmeSayisi}
            tutar={gorusmeTahminTutar || null}
            href={`/gorusmeler${soloEki(aktifAralik)}`}
            aciklama="Yapılan tüm görüşmeler (tahmini TL)"
            vurgu="text-sky-700 dark:text-sky-400"
          />

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

// --- SVG huni ---------------------------------------------------------------

type IcDilim = {
  etiket: string;
  sayi: number;
  renk: string; // SVG fill
};

type KatmanGeometri = {
  id: string;
  baslik: string;
  sayi: number;
  tutar: number | null;
  ustOran: number; // 0..1
  altOran: number; // 0..1
  renk: string;
  href: string;
  dilimler?: IcDilim[];
};

function HuniGorsel({
  katmanlar,
  donusumGorusmeTeklif,
  donusumTeklifOperasyon,
}: {
  katmanlar: KatmanGeometri[];
  donusumGorusmeTeklif: number | null;
  donusumTeklifOperasyon: number | null;
}) {
  const W = 600;
  const KATMAN_H = 130;
  const ROZET_H = 36; // dönüşüm rozeti için ara boşluk
  const H = katmanlar.length * KATMAN_H + (katmanlar.length - 1) * ROZET_H + 20;

  const donusumler = [donusumGorusmeTeklif, donusumTeklifOperasyon];

  let y = 10;
  const parcalar: React.ReactNode[] = [];

  katmanlar.forEach((k, i) => {
    const yTop = y;
    const yBot = y + KATMAN_H;
    const ustW = k.ustOran * W;
    const altW = k.altOran * W;
    const xUstSol = (W - ustW) / 2;
    const xUstSag = xUstSol + ustW;
    const xAltSol = (W - altW) / 2;
    const xAltSag = xAltSol + altW;

    // Ana trapez path
    const path = `M ${xUstSol} ${yTop} L ${xUstSag} ${yTop} L ${xAltSag} ${yBot} L ${xAltSol} ${yBot} Z`;

    // İç dilim renk şeritleri (varsa) — trapezin içine çizilir
    const dilimToplam = k.dilimler
      ? k.dilimler.reduce((acc, d) => acc + d.sayi, 0)
      : 0;

    if (k.dilimler && dilimToplam > 0) {
      let dilimT = 0; // 0..1 trapez yüksekliğinde
      k.dilimler.forEach((d, di) => {
        if (d.sayi === 0) return;
        const t1 = dilimT;
        const t2 = dilimT + d.sayi / dilimToplam;
        dilimT = t2;

        // t1'den t2'ye kadar olan yatay dilim — trapez eğimine göre interpolasyon
        const yD1 = yTop + t1 * KATMAN_H;
        const yD2 = yTop + t2 * KATMAN_H;
        const wD1 = ustW + t1 * (altW - ustW);
        const wD2 = ustW + t2 * (altW - ustW);
        const xD1Sol = (W - wD1) / 2;
        const xD1Sag = xD1Sol + wD1;
        const xD2Sol = (W - wD2) / 2;
        const xD2Sag = xD2Sol + wD2;

        const dPath = `M ${xD1Sol} ${yD1} L ${xD1Sag} ${yD1} L ${xD2Sag} ${yD2} L ${xD2Sol} ${yD2} Z`;
        parcalar.push(
          <path
            key={`${k.id}-dilim-${di}`}
            d={dPath}
            fill={d.renk}
            opacity={0.95}
          >
            <title>{`${d.etiket}: ${d.sayi.toLocaleString("tr-TR")}`}</title>
          </path>,
        );
      });
    } else {
      // Dilim yoksa ana trapez tek renk
      parcalar.push(
        <path
          key={`${k.id}-anatrapez`}
          d={path}
          fill={k.renk}
        >
          <title>{`${k.baslik}: ${k.sayi.toLocaleString("tr-TR")}`}</title>
        </path>,
      );
    }

    // Trapez konturu
    parcalar.push(
      <path
        key={`${k.id}-stroke`}
        d={path}
        fill="none"
        stroke="rgba(0,0,0,0.25)"
        strokeWidth={1.5}
      />,
    );

    // Metin — başlık + sayı + tutar
    const textY = yTop + KATMAN_H / 2;
    parcalar.push(
      <g key={`${k.id}-text`} pointerEvents="none">
        <text
          x={W / 2}
          y={textY - 14}
          textAnchor="middle"
          className="fill-white text-[13px] font-semibold"
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
        >
          {k.baslik}
        </text>
        <text
          x={W / 2}
          y={textY + 10}
          textAnchor="middle"
          className="fill-white text-[22px] font-bold tabular-nums"
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}
        >
          {k.sayi.toLocaleString("tr-TR")}
        </text>
        {k.tutar !== null && k.tutar > 0 && (
          <text
            x={W / 2}
            y={textY + 30}
            textAnchor="middle"
            className="fill-white/90 text-[12px] font-medium tabular-nums"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
          >
            {trTutar(k.tutar)}
          </text>
        )}
      </g>,
    );

    y += KATMAN_H;

    // Dönüşüm rozeti (son katmandan sonra yok)
    if (i < katmanlar.length - 1) {
      const oran = donusumler[i];
      const rozetY = y + ROZET_H / 2;
      parcalar.push(
        <g key={`donusum-${i}`}>
          <rect
            x={W / 2 - 70}
            y={rozetY - 12}
            width={140}
            height={24}
            rx={12}
            className="fill-background stroke-border"
            strokeWidth={1}
          />
          <text
            x={W / 2}
            y={rozetY + 4}
            textAnchor="middle"
            className="fill-foreground text-[11px] font-medium"
          >
            {oran !== null ? `Dönüşüm: %${oran}` : "Dönüşüm: —"}
          </text>
        </g>,
      );
      y += ROZET_H;
    }
  });

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto block h-auto w-full max-w-2xl"
        role="img"
        aria-label="Satış hunisi"
      >
        {parcalar}
      </svg>
    </div>
  );
}

// --- Yan panel kart ---------------------------------------------------------

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
    <Card className="transition-shadow hover:shadow-md">
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
        {aciklama && <CardDescription className="text-[11px]">{aciklama}</CardDescription>}
      </CardHeader>
      {dilimler && dilimler.length > 0 && (
        <CardContent className="space-y-1 pt-0">
          {dilimler.map((d) => {
            const DIcon = d.icon;
            const oran =
              sayi > 0 ? Math.round((d.sayi / sayi) * 100) : 0;
            return (
              <Link
                key={d.etiket}
                href={d.href}
                className="flex items-center justify-between gap-2 rounded-md border bg-background px-2 py-1.5 text-xs transition-colors hover:bg-muted/60"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`inline-block size-2 shrink-0 rounded-full ${d.renk}`} />
                  <DIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium">{d.etiket}</span>
                  <Badge variant="outline" className="h-4 shrink-0 px-1 text-[9px]">
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

// Not: ArrowDown import kaldı — ileride dönüşüm rozetinde ok ikonu olarak kullanılabilir.
void ArrowDown;
