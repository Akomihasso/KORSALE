import Link from "next/link";
import {
  ArrowDown,
  CheckCircle2,
  ClipboardList,
  Clock,
  CircleCheck,
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

function aralikParametresi(aralik: Aralik): string {
  return aralik === "AY" ? "" : `&aralik=${aralik}`;
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
    // Görüşme katmanı
    gorusmeSayisi,
    gorusmeTahminAgg,
    // Teklif ana + iç dilimler
    teklifToplamSayisi,
    teklifToplamGruplar,
    teklifOnayBekleyenSayisi,
    teklifOnayBekleyenGruplar,
    teklifOdemeBekleyenSayisi,
    teklifOdemeBekleyenGruplar,
    teklifParaAlindiSayisi,
    teklifParaAlindiGruplar,
    // Operasyon ana + iç dilimler
    operasyonToplamSayisi,
    operasyonBekleyenSayisi,
    operasyonIslemdeSayisi,
    operasyonTamamlandiSayisi,
    kurlar,
  ] = await Promise.all([
    // Görüşme
    prisma.gorusme.count({ where: tarihGorusme }),
    prisma.gorusme.aggregate({
      _sum: { tahminiTutar: true },
      where: tarihGorusme,
    }),

    // Teklif — toplam (dönem içinde oluşturulanlar)
    prisma.teklif.count({ where: tarihCreated }),
    prisma.teklif.groupBy({
      by: ["paraBirimi"],
      _sum: { netTutar: true },
      where: tarihCreated,
    }),

    // Teklif — Onay bekleyen (müşteriye gönderildi, karar yok)
    prisma.teklif.count({
      where: { durum: { in: ["GONDERILDI", "BEKLEMEDE"] }, ...tarihCreated },
    }),
    prisma.teklif.groupBy({
      by: ["paraBirimi"],
      _sum: { netTutar: true },
      where: { durum: { in: ["GONDERILDI", "BEKLEMEDE"] }, ...tarihCreated },
    }),

    // Teklif — Onaylanan · Ödeme bekliyor (KABUL + odemeAlindiTar null, kabulTar kolonu)
    prisma.teklif.count({
      where: { durum: "KABUL", odemeAlindiTar: null, ...tarihKabul },
    }),
    prisma.teklif.groupBy({
      by: ["paraBirimi"],
      _sum: { netTutar: true },
      where: { durum: "KABUL", odemeAlindiTar: null, ...tarihKabul },
    }),

    // Teklif — Para alındı (KABUL + odemeAlindiTar not null, odemeAlindiTar kolonu)
    prisma.teklif.count({
      where: { durum: "KABUL", odemeAlindiTar: { not: null }, ...tarihOdeme },
    }),
    prisma.teklif.groupBy({
      by: ["paraBirimi"],
      _sum: { netTutar: true },
      where: { durum: "KABUL", odemeAlindiTar: { not: null }, ...tarihOdeme },
    }),

    // Operasyon — toplam (dönem içinde açılan)
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

  // Dönüşüm oranları
  const donusumGorusmeTeklif =
    gorusmeSayisi > 0
      ? Math.round((teklifToplamSayisi / gorusmeSayisi) * 100)
      : null;
  const donusumTeklifOperasyon =
    teklifToplamSayisi > 0
      ? Math.round((operasyonToplamSayisi / teklifToplamSayisi) * 100)
      : null;

  // Teklif "diğer" (reddedilen + iptal + taslak + indirim onay) — toplamın geri kalanı
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

  const aralikEki = aralikParametresi(aktifAralik);

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

      <div className="mx-auto max-w-3xl space-y-3">
        {/* GÖRÜŞME katmanı */}
        <KatmanKarti
          ustOlcek={1}
          baslik="Görüşmeler"
          toplamSayi={gorusmeSayisi}
          toplamTutar={gorusmeTahminTutar || null}
          toplamHref={`/gorusmeler${aktifAralik !== "AY" ? `?aralik=${aktifAralik}` : ""}`}
          icon={MessageSquare}
          renk="sky"
          aciklama="Tahmini iş tutarı (TL karşılığı)"
        />

        {/* Dönüşüm oku */}
        <DonusumRozeti
          enBuyuk={Math.max(gorusmeSayisi, teklifToplamSayisi, 1)}
          sayi={teklifToplamSayisi}
          onceki="Görüşme"
          sonraki="Teklif"
          oran={donusumGorusmeTeklif}
        />

        {/* TEKLİF katmanı — iç dilimli */}
        <KatmanKarti
          ustOlcek={
            Math.max(gorusmeSayisi, teklifToplamSayisi, operasyonToplamSayisi) >
            0
              ? teklifToplamSayisi /
                Math.max(
                  gorusmeSayisi,
                  teklifToplamSayisi,
                  operasyonToplamSayisi,
                )
              : 1
          }
          baslik="Teklifler"
          toplamSayi={teklifToplamSayisi}
          toplamTutar={teklifToplamCiro || null}
          toplamHref={`/teklifler${aktifAralik !== "AY" ? `?aralik=${aktifAralik}` : ""}`}
          icon={FileText}
          renk="indigo"
          aciklama="Oluşturulmuş tüm teklifler"
          dilimler={[
            {
              etiket: "Onay bekleyen",
              sayi: teklifOnayBekleyenSayisi,
              tutar: teklifOnayBekleyenCiro,
              renk: "bg-sky-500",
              textRenk: "text-sky-700 dark:text-sky-400",
              href: `/teklifler?grup=BEKLIYOR${aralikEki}`,
              icon: Hourglass,
            },
            {
              etiket: "Onaylanan · Ödeme bekliyor",
              sayi: teklifOdemeBekleyenSayisi,
              tutar: teklifOdemeBekleyenCiro,
              renk: "bg-amber-500",
              textRenk: "text-amber-700 dark:text-amber-400",
              href: `/teklifler?grup=ONAYLANDI${aralikEki}`,
              icon: CircleCheck,
            },
            {
              etiket: "Onaylanan · Ödemesi gelen",
              sayi: teklifParaAlindiSayisi,
              tutar: teklifParaAlindiCiro,
              renk: "bg-emerald-500",
              textRenk: "text-emerald-700 dark:text-emerald-400",
              href: `/teklifler?grup=PARA_ALINDI${aralikEki}`,
              icon: Wallet,
            },
          ]}
          digerSayisi={teklifDigerSayisi}
          digerEtiket="Reddedilen / İptal / Taslak"
          digerHref={`/teklifler${aktifAralik !== "AY" ? `?aralik=${aktifAralik}` : ""}`}
        />

        {/* Dönüşüm oku */}
        <DonusumRozeti
          enBuyuk={Math.max(teklifToplamSayisi, operasyonToplamSayisi, 1)}
          sayi={operasyonToplamSayisi}
          onceki="Teklif"
          sonraki="Operasyon"
          oran={donusumTeklifOperasyon}
        />

        {/* OPERASYON katmanı — iç dilimli */}
        <KatmanKarti
          ustOlcek={
            Math.max(gorusmeSayisi, teklifToplamSayisi, operasyonToplamSayisi) >
            0
              ? operasyonToplamSayisi /
                Math.max(
                  gorusmeSayisi,
                  teklifToplamSayisi,
                  operasyonToplamSayisi,
                )
              : 1
          }
          baslik="Operasyonlar"
          toplamSayi={operasyonToplamSayisi}
          toplamTutar={null}
          toplamHref={`/operasyonlar${aktifAralik !== "AY" ? `?aralik=${aktifAralik}` : ""}`}
          icon={ClipboardList}
          renk="emerald"
          aciklama="Para gelen tekliflerden açılan dosyalar"
          dilimler={[
            {
              etiket: "Bekleyen",
              sayi: operasyonBekleyenSayisi,
              tutar: null,
              renk: "bg-sky-500",
              textRenk: "text-sky-700 dark:text-sky-400",
              href: `/operasyonlar?durum=BEKLIYOR${aralikEki}`,
              icon: Clock,
            },
            {
              etiket: "İşlemde",
              sayi: operasyonIslemdeSayisi,
              tutar: null,
              renk: "bg-amber-500",
              textRenk: "text-amber-700 dark:text-amber-400",
              href: `/operasyonlar?durum=islemde${aralikEki}`,
              icon: Pause,
            },
            {
              etiket: "Tamamlanan",
              sayi: operasyonTamamlandiSayisi,
              tutar: null,
              renk: "bg-emerald-500",
              textRenk: "text-emerald-700 dark:text-emerald-400",
              href: `/operasyonlar?durum=TAMAMLANDI${aralikEki}`,
              icon: CheckCircle2,
            },
          ]}
          digerSayisi={operasyonDigerSayisi}
          digerEtiket="İptal"
          digerHref={`/operasyonlar?durum=IPTAL${aralikEki}`}
        />
      </div>
    </div>
  );
}

// --- yardımcılar -----------------------------------------------------------

type Dilim = {
  etiket: string;
  sayi: number;
  tutar: number | null;
  renk: string; // tailwind bg sınıfı
  textRenk: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

function KatmanKarti({
  ustOlcek,
  baslik,
  toplamSayi,
  toplamTutar,
  toplamHref,
  icon: Icon,
  renk,
  aciklama,
  dilimler,
  digerSayisi,
  digerEtiket,
  digerHref,
}: {
  ustOlcek: number;
  baslik: string;
  toplamSayi: number;
  toplamTutar: number | null;
  toplamHref: string;
  icon: React.ComponentType<{ className?: string }>;
  renk: "sky" | "indigo" | "emerald";
  aciklama?: string;
  dilimler?: Dilim[];
  digerSayisi?: number;
  digerEtiket?: string;
  digerHref?: string;
}) {
  // Trapez etkisi için üst genişlik → iki yan padding (katman daraldıkça içeri çeker).
  const kenarPadding = Math.round((1 - Math.max(0.5, ustOlcek)) * 60);

  const renkSinif: Record<typeof renk, string> = {
    sky: "border-sky-300/60 bg-sky-50 dark:border-sky-700/40 dark:bg-sky-950/30",
    indigo:
      "border-indigo-300/60 bg-indigo-50 dark:border-indigo-700/40 dark:bg-indigo-950/30",
    emerald:
      "border-emerald-300/60 bg-emerald-50 dark:border-emerald-700/40 dark:bg-emerald-950/30",
  };

  const toplam = dilimler
    ? dilimler.reduce((acc, d) => acc + d.sayi, 0) + (digerSayisi ?? 0)
    : toplamSayi;

  return (
    <div style={{ paddingLeft: kenarPadding, paddingRight: kenarPadding }}>
      <Card
        className={`border-2 shadow-sm transition-shadow hover:shadow-md ${renkSinif[renk]}`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <Link href={toplamHref} className="flex items-center gap-2 hover:underline">
              <Icon className="size-5 text-foreground/70" />
              <CardTitle className="text-base">{baslik}</CardTitle>
            </Link>
            <div className="text-right">
              <div className="text-2xl font-bold tabular-nums">
                {toplamSayi.toLocaleString("tr-TR")}
              </div>
              {toplamTutar !== null && toplamTutar > 0 && (
                <div className="text-sm font-medium tabular-nums text-foreground/70">
                  {trTutar(toplamTutar)}
                </div>
              )}
            </div>
          </div>
          {aciklama && (
            <CardDescription className="text-xs">{aciklama}</CardDescription>
          )}
        </CardHeader>

        {dilimler && dilimler.length > 0 && (
          <CardContent className="space-y-2 pt-0">
            {/* Yığılmış renk çubuk — iç dağılım */}
            <YigilmisCubuk
              dilimler={dilimler}
              digerSayisi={digerSayisi ?? 0}
              toplam={toplam}
            />

            {/* Her dilim için satır (adet + tutar + href) */}
            <div className="space-y-1 pt-1">
              {dilimler.map((d) => {
                const DIcon = d.icon;
                const oran =
                  toplam > 0 ? Math.round((d.sayi / toplam) * 100) : 0;
                return (
                  <Link
                    key={d.etiket}
                    href={d.href}
                    className="flex items-center justify-between gap-3 rounded-md border bg-background/70 px-2.5 py-1.5 text-xs transition-colors hover:bg-background"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`inline-block size-2 rounded-full ${d.renk}`} />
                      <DIcon className={`size-3.5 ${d.textRenk}`} />
                      <span className="font-medium">{d.etiket}</span>
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                        %{oran}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <span className="font-semibold tabular-nums">
                        {d.sayi.toLocaleString("tr-TR")}
                      </span>
                      {d.tutar !== null && d.tutar > 0 && (
                        <span className="w-28 text-xs text-muted-foreground tabular-nums">
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
                  className="flex items-center justify-between gap-3 rounded-md border bg-background/40 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-background"
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-block size-2 rounded-full bg-muted-foreground/40" />
                    <span>{digerEtiket}</span>
                  </div>
                  <span className="tabular-nums">
                    {digerSayisi!.toLocaleString("tr-TR")}
                  </span>
                </Link>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

function YigilmisCubuk({
  dilimler,
  digerSayisi,
  toplam,
}: {
  dilimler: Dilim[];
  digerSayisi: number;
  toplam: number;
}) {
  if (toplam === 0) {
    return (
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-0" />
      </div>
    );
  }

  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
      {dilimler.map((d) => {
        const w = (d.sayi / toplam) * 100;
        if (w === 0) return null;
        return (
          <div
            key={d.etiket}
            className={d.renk}
            style={{ width: `${w}%` }}
            title={`${d.etiket}: ${d.sayi}`}
          />
        );
      })}
      {digerSayisi > 0 && (
        <div
          className="bg-muted-foreground/30"
          style={{ width: `${(digerSayisi / toplam) * 100}%` }}
          title={`Diğer: ${digerSayisi}`}
        />
      )}
    </div>
  );
}

function DonusumRozeti({
  enBuyuk,
  sayi,
  onceki,
  sonraki,
  oran,
}: {
  enBuyuk: number;
  sayi: number;
  onceki: string;
  sonraki: string;
  oran: number | null;
}) {
  const genislikOran = enBuyuk > 0 ? sayi / enBuyuk : 0;
  const kenarPadding = Math.round((1 - Math.max(0.5, genislikOran)) * 60);
  return (
    <div
      className="flex items-center justify-center"
      style={{ paddingLeft: kenarPadding, paddingRight: kenarPadding }}
    >
      <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs shadow-sm">
        <ArrowDown className="size-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">
          {onceki} → {sonraki}
        </span>
        <span className="font-semibold">
          {oran !== null ? `%${oran}` : "—"}
        </span>
      </div>
    </div>
  );
}
