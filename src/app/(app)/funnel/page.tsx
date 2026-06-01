import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileText,
  MessageSquare,
  Send,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata = { title: "Funnel" };

type SearchParams = Promise<{ aralik?: string }>;

const KATMAN_RENK = [
  "fill-sky-300 dark:fill-sky-400/80",
  "fill-sky-400 dark:fill-sky-500/80",
  "fill-sky-500 dark:fill-sky-600/80",
  "fill-emerald-500 dark:fill-emerald-600/80",
  "fill-emerald-600 dark:fill-emerald-700/80",
];

function buildHref(aralik: Aralik) {
  return aralik === "AY" ? "/funnel" : `/funnel?aralik=${aralik}`;
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

  const tarihGorusme = baslangic ? { tarih: { gte: baslangic } } : {};
  const tarihTeklif = baslangic ? { createdAt: { gte: baslangic } } : {};

  const [
    gorusmeSayisi,
    gorusmeTahminToplam,
    teklifSayisi,
    teklifNetGruplar,
    cevapBekleyenSayisi,
    cevapBekleyenGruplar,
    kabulSayisi,
    kabulGruplar,
    operasyonSayisi,
    aktifOperasyonSayisi,
    kurlar,
  ] = await Promise.all([
    prisma.gorusme.count({ where: tarihGorusme }),
    prisma.gorusme.aggregate({
      _sum: { tahminiTutar: true },
      where: tarihGorusme,
    }),
    prisma.teklif.count({ where: tarihTeklif }),
    prisma.teklif.groupBy({
      by: ["paraBirimi"],
      _sum: { netTutar: true },
      where: tarihTeklif,
    }),
    prisma.teklif.count({
      where: { durum: { in: ["GONDERILDI", "BEKLEMEDE"] }, ...tarihTeklif },
    }),
    prisma.teklif.groupBy({
      by: ["paraBirimi"],
      _sum: { netTutar: true },
      where: { durum: { in: ["GONDERILDI", "BEKLEMEDE"] }, ...tarihTeklif },
    }),
    prisma.teklif.count({
      where: {
        durum: "KABUL",
        ...(baslangic ? { kabulTar: { gte: baslangic } } : {}),
      },
    }),
    prisma.teklif.groupBy({
      by: ["paraBirimi"],
      _sum: { netTutar: true },
      where: {
        durum: "KABUL",
        ...(baslangic ? { kabulTar: { gte: baslangic } } : {}),
      },
    }),
    prisma.operasyon.count({
      where: baslangic ? { createdAt: { gte: baslangic } } : undefined,
    }),
    prisma.operasyon.count({
      where: {
        durum: { in: ["BEKLIYOR", "DEVAM_EDIYOR", "ASKIDA"] },
        ...(baslangic ? { createdAt: { gte: baslangic } } : {}),
      },
    }),
    guncelKurlar(),
  ]);

  const teklifNetToplam = gruplariTlyeTopla(teklifNetGruplar, kurlar);
  const cevapBekleyenTutar = gruplariTlyeTopla(cevapBekleyenGruplar, kurlar);
  const kabulTutar = gruplariTlyeTopla(kabulGruplar, kurlar);

  type Katman = {
    isim: string;
    sayi: number;
    tutar: number | null;
    aciklama: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  };

  const katmanlar: Katman[] = [
    {
      isim: "Görüşmeler",
      sayi: gorusmeSayisi,
      tutar: Number(gorusmeTahminToplam._sum.tahminiTutar ?? 0) || null,
      aciklama: "Yapılan tüm görüşmeler (tahmini iş tutarı)",
      href: "/gorusmeler",
      icon: MessageSquare,
    },
    {
      isim: "Teklifler",
      sayi: teklifSayisi,
      tutar: teklifNetToplam || null,
      aciklama: "Oluşturulmuş tüm teklifler (TL karşılığı)",
      href: "/teklifler",
      icon: FileText,
    },
    {
      isim: "Cevap Bekleyen",
      sayi: cevapBekleyenSayisi,
      tutar: cevapBekleyenTutar || null,
      aciklama: "Müşteriye gönderildi, henüz kararsız",
      href: "/teklifler?grup=ACIK",
      icon: Send,
    },
    {
      isim: "Kazanılan (Ciro)",
      sayi: kabulSayisi,
      tutar: kabulTutar || null,
      aciklama: "Kabul edilen teklifler — gerçek ciro (TL)",
      href: "/teklifler?grup=KAZANILAN",
      icon: CheckCircle2,
    },
    {
      isim: "Operasyonlar",
      sayi: operasyonSayisi,
      tutar: null,
      aciklama: `${aktifOperasyonSayisi} tanesi devam ediyor`,
      href: "/operasyonlar",
      icon: ClipboardList,
    },
  ];

  // En büyük sayıya göre genişlik orantılı
  const enBuyuk = Math.max(1, ...katmanlar.map((k) => k.sayi));
  const minOran = 0.18; // en daralan katman bile bu kadar görünür

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Funnel</h1>
          <p className="text-sm text-muted-foreground">
            Satış hunisinin {ARALIK_ETIKET[aktifAralik].toLocaleLowerCase("tr")} görünümü
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
        {/* SOL — Funnel görsel */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Akış</CardTitle>
            <CardDescription>
              Her katman bir önceki adımdan geçen kayıt sayısını gösterir
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FunnelGorsel
              katmanlar={katmanlar}
              enBuyuk={enBuyuk}
              minOran={minOran}
            />
          </CardContent>
        </Card>

        {/* SAĞ — Katman detayları */}
        <div className="space-y-3 lg:col-span-2">
          {katmanlar.map((k, i) => {
            const Icon = k.icon;
            const oran = enBuyuk > 0 ? (k.sayi / enBuyuk) * 100 : 0;
            const ondanSonra = katmanlar[i + 1];
            const donusum =
              ondanSonra && k.sayi > 0
                ? Math.round((ondanSonra.sayi / k.sayi) * 100)
                : null;

            return (
              <Link key={k.isim} href={k.href} className="block">
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Icon className="size-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{k.isim}</span>
                      </div>
                      <span className="text-xl font-semibold tabular-nums">
                        {k.sayi.toLocaleString("tr-TR")}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{k.aciklama}</p>
                    <div className="h-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary/70"
                        style={{ width: `${oran}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>
                        {k.tutar !== null && k.tutar > 0
                          ? trTutar(k.tutar)
                          : "—"}
                      </span>
                      {donusum !== null && (
                        <span className="flex items-center gap-1">
                          <ArrowRight className="size-3" />
                          {ondanSonra.isim}: %{donusum}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FunnelGorsel({
  katmanlar,
  enBuyuk,
  minOran,
}: {
  katmanlar: { isim: string; sayi: number; tutar: number | null }[];
  enBuyuk: number;
  minOran: number;
}) {
  const W = 600;
  const KATMAN_Y = 88;
  const ARALIK = 8;
  const H = katmanlar.length * (KATMAN_Y + ARALIK) - ARALIK;

  // Her katmanın orantısal genişliği (min 18%, max 100%)
  const genislikler = katmanlar.map((k) => {
    const oran = enBuyuk > 0 ? k.sayi / enBuyuk : 0;
    return Math.max(minOran, oran);
  });

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto block h-auto w-full max-w-2xl"
        role="img"
        aria-label="Satış hunisi"
      >
        {katmanlar.map((k, i) => {
          const yTop = i * (KATMAN_Y + ARALIK);
          const yBot = yTop + KATMAN_Y;
          const ustGenislik = genislikler[i] * W;
          const altGenislik =
            (genislikler[i + 1] !== undefined ? genislikler[i + 1] : genislikler[i] * 0.8) * W;

          const x1 = (W - ustGenislik) / 2;
          const x2 = x1 + ustGenislik;
          const x3 = (W + altGenislik) / 2;
          const x4 = (W - altGenislik) / 2;

          const path = `M ${x1} ${yTop} L ${x2} ${yTop} L ${x3} ${yBot} L ${x4} ${yBot} Z`;

          return (
            <g key={k.isim}>
              <path
                d={path}
                className={`${KATMAN_RENK[i] ?? KATMAN_RENK[KATMAN_RENK.length - 1]} transition-opacity hover:opacity-90`}
              />
              <text
                x={W / 2}
                y={yTop + KATMAN_Y / 2 - 8}
                textAnchor="middle"
                className="fill-white text-[14px] font-semibold"
              >
                {k.isim}
              </text>
              <text
                x={W / 2}
                y={yTop + KATMAN_Y / 2 + 14}
                textAnchor="middle"
                className="fill-white text-[18px] font-bold tabular-nums"
              >
                {k.sayi.toLocaleString("tr-TR")}
                {k.tutar !== null && k.tutar > 0 && (
                  <tspan className="ml-2 text-[12px] font-medium opacity-90">
                    {"  ·  "}
                    {trTutar(k.tutar)}
                  </tspan>
                )}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
