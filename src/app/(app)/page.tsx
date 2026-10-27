import Link from "next/link";
import {
  AlertCircle,
  Bell,
  CalendarClock,
  ClipboardList,
  CircleCheck,
  FileText,
  Inbox,
  MessageSquare,
  Pause,
  Search,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { BelgeDurum, OperasyonDurum } from "@prisma/client";

import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { trGoreceli, trTarihSaat, trTutar } from "@/lib/format";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Genel Durum",
};

type SearchParams = Promise<{ aralik?: string }>;

const ONAY_BEKLEYEN_TEKLIF_DURUMLARI: BelgeDurum[] = ["GONDERILDI", "BEKLEMEDE"];
const AKTIF_OPERASYON_DURUMLARI: OperasyonDurum[] = [
  "BEKLIYOR",
  "DEVAM_EDIYOR",
  "ASKIDA",
];

function buildHref(aralik: Aralik) {
  return aralik === "AY" ? "/" : `/?aralik=${aralik}`;
}

export default async function GenelDurumPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireAuth();
  const { aralik } = await searchParams;
  const aktifAralik: Aralik = normalizeAralik(aralik);
  const baslangic = aralikBaslangic(aktifAralik);
  const tarihFiltresi = baslangic ? { gte: baslangic } : undefined;

  const [
    gorusmeSayisi,
    teklifSayisi,
    teklifCiroGruplar,
    onayBekleyenSayisi,
    onayBekleyenGruplar,
    odemeBekleyenSayisi,
    odemeBekleyenGruplar,
    odemesiGelenSayisi,
    odemesiGelenGruplar,
    aktifOperasyonSayisi,
    askidakiSayisi,
    indirimOnayBekleyenSayisi,
    bekleyenDevirler,
    indirimOnayBekleyen,
    cevapBekleyenTeklifler,
    odemeBekleyenTeklifler,
    askidakiOperasyonlar,
    bekleyenOperasyonlar,
    hatirlatmaGorusmeler,
    kurlar,
  ] = await Promise.all([
    // KPI: Görüşme sayısı
    prisma.gorusme.count({
      where: tarihFiltresi ? { tarih: tarihFiltresi } : undefined,
    }),
    // KPI: Teklif sayısı — tüm teklifler (dönem içinde oluşturulanlar)
    prisma.teklif.count({
      where: tarihFiltresi ? { createdAt: tarihFiltresi } : undefined,
    }),
    // KPI: Teklif cirosu (toplam netTutar) — para birimi bazında
    prisma.teklif.groupBy({
      by: ["paraBirimi"],
      _sum: { netTutar: true },
      where: tarihFiltresi ? { createdAt: tarihFiltresi } : {},
    }),
    // KPI: Onay bekleyen teklif adedi (müşteriye gönderildi, karar yok)
    prisma.teklif.count({
      where: {
        durum: { in: ONAY_BEKLEYEN_TEKLIF_DURUMLARI },
        ...(tarihFiltresi ? { createdAt: tarihFiltresi } : {}),
      },
    }),
    // KPI: Onay bekleyen teklif cirosu
    prisma.teklif.groupBy({
      by: ["paraBirimi"],
      _sum: { netTutar: true },
      where: {
        durum: { in: ONAY_BEKLEYEN_TEKLIF_DURUMLARI },
        ...(tarihFiltresi ? { createdAt: tarihFiltresi } : {}),
      },
    }),
    // KPI: Onaylanan — ödeme bekliyor adedi (KABUL & odemeAlindiTar = null)
    prisma.teklif.count({
      where: {
        durum: "KABUL",
        odemeAlindiTar: null,
        ...(tarihFiltresi ? { kabulTar: tarihFiltresi } : {}),
      },
    }),
    // KPI: Onaylanan — ödeme bekliyor cirosu
    prisma.teklif.groupBy({
      by: ["paraBirimi"],
      _sum: { netTutar: true },
      where: {
        durum: "KABUL",
        odemeAlindiTar: null,
        ...(tarihFiltresi ? { kabulTar: tarihFiltresi } : {}),
      },
    }),
    // KPI: Onaylanan — ödemesi gelen adedi (KABUL & para alındı)
    prisma.teklif.count({
      where: {
        durum: "KABUL",
        odemeAlindiTar: { not: null },
        ...(tarihFiltresi ? { odemeAlindiTar: tarihFiltresi } : {}),
      },
    }),
    // KPI: Onaylanan — ödemesi gelen cirosu
    prisma.teklif.groupBy({
      by: ["paraBirimi"],
      _sum: { netTutar: true },
      where: {
        durum: "KABUL",
        odemeAlindiTar: { not: null },
        ...(tarihFiltresi ? { odemeAlindiTar: tarihFiltresi } : {}),
      },
    }),
    // KPI: Aktif operasyon sayısı (anlık — tarih filtresi yok)
    prisma.operasyon.count({
      where: { durum: { in: AKTIF_OPERASYON_DURUMLARI } },
    }),
    // Gündem: askıdaki operasyon
    prisma.operasyon.count({ where: { durum: "ASKIDA" } }),
    // Gündem: indirim onayı bekleyen teklif
    prisma.teklif.count({ where: { durum: "ONAY_BEKLIYOR" } }),

    // BEKLEYENLER PANELİ (sistem geneli — herkes tüm hareketleri görür)
    // Bekleyen iş devri
    prisma.gorevDevir.findMany({
      where: { durum: "BEKLIYOR" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        devreden: { select: { name: true } },
        devralan: { select: { name: true } },
        gorusme: { select: { konu: true } },
        teklif: { select: { belgeNo: true, baslik: true } },
        operasyon: {
          select: { teklif: { select: { belgeNo: true, baslik: true } } },
        },
      },
    }),
    // İndirim onayı bekleyen
    prisma.teklif.findMany({
      where: { durum: "ONAY_BEKLIYOR" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        belgeNo: true,
        baslik: true,
        indirimYuzde: true,
        firma: { select: { ad: true } },
        sorumlu: { select: { name: true } },
      },
    }),
    // Cevap bekleyen teklifler
    prisma.teklif.findMany({
      where: { durum: { in: ONAY_BEKLEYEN_TEKLIF_DURUMLARI } },
      orderBy: { gonderilmeTar: "desc" },
      take: 5,
      select: {
        id: true,
        belgeNo: true,
        baslik: true,
        gonderilmeTar: true,
        firma: { select: { ad: true } },
        sorumlu: { select: { name: true } },
      },
    }),
    // Onaylandı, ödeme bekleyen teklifler
    prisma.teklif.findMany({
      where: { durum: "KABUL", odemeAlindiTar: null },
      orderBy: { kabulTar: "desc" },
      take: 5,
      select: {
        id: true,
        belgeNo: true,
        baslik: true,
        netTutar: true,
        paraBirimi: true,
        kabulTar: true,
        firma: { select: { ad: true } },
        sorumlu: { select: { name: true } },
      },
    }),
    // Askıdaki operasyon
    prisma.operasyon.findMany({
      where: { durum: "ASKIDA" },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        bekletmeNeden: true,
        sorumlu: { select: { name: true } },
        teklif: {
          select: {
            belgeNo: true,
            baslik: true,
            firma: { select: { ad: true } },
          },
        },
      },
    }),
    // Başlamayı bekleyen operasyon
    prisma.operasyon.findMany({
      where: { durum: "BEKLIYOR" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        createdAt: true,
        sorumlu: { select: { name: true } },
        teklif: {
          select: {
            belgeNo: true,
            baslik: true,
            netTutar: true,
            firma: { select: { ad: true } },
          },
        },
      },
    }),
    // Hatırlatma vakti geçmiş görüşmeler
    prisma.gorusme.findMany({
      where: {
        durum: "ACIK",
        hatirlatma: { lte: new Date() },
      },
      orderBy: { hatirlatma: "asc" },
      take: 5,
      select: {
        id: true,
        konu: true,
        hatirlatma: true,
        firma: { select: { ad: true } },
        sorumlu: { select: { name: true } },
      },
    }),
    // TCMB güncel kurları (24sa cache)
    guncelKurlar(),
  ]);

  const teklifCiro = gruplariTlyeTopla(teklifCiroGruplar, kurlar);
  const onayBekleyenCiro = gruplariTlyeTopla(onayBekleyenGruplar, kurlar);
  const odemeBekleyenCiro = gruplariTlyeTopla(odemeBekleyenGruplar, kurlar);
  const odemesiGelenCiro = gruplariTlyeTopla(odemesiGelenGruplar, kurlar);

  const donemEtiketi = ARALIK_ETIKET[aktifAralik];

  type Kpi = {
    baslik: string;
    deger: string;
    altDeger?: string;
    aciklama: string;
    icon: React.ComponentType<{ className?: string }>;
    href?: string;
    accent?: string;
  };

  const kpilar: Kpi[] = [
    {
      baslik: "Görüşme",
      deger: gorusmeSayisi.toLocaleString("tr-TR"),
      aciklama: donemEtiketi,
      icon: MessageSquare,
      href: "/gorusmeler",
    },
    {
      baslik: "Teklif",
      deger: teklifSayisi.toLocaleString("tr-TR"),
      altDeger: trTutar(teklifCiro),
      aciklama: donemEtiketi,
      icon: FileText,
      href: "/teklifler",
    },
    {
      baslik: "Onay Bekleyen Teklifler",
      deger: onayBekleyenSayisi.toLocaleString("tr-TR"),
      altDeger: trTutar(onayBekleyenCiro),
      aciklama: donemEtiketi,
      icon: TrendingUp,
      href: "/teklifler?grup=BEKLIYOR",
      accent: "text-sky-600 dark:text-sky-400",
    },
    {
      baslik: "Onaylanan · Ödeme Bekliyor",
      deger: odemeBekleyenSayisi.toLocaleString("tr-TR"),
      altDeger: trTutar(odemeBekleyenCiro),
      aciklama: donemEtiketi,
      icon: CircleCheck,
      href: "/teklifler?grup=ONAYLANDI",
      accent: "text-amber-600 dark:text-amber-400",
    },
    {
      baslik: "Onaylanan · Ödemesi Gelen",
      deger: odemesiGelenSayisi.toLocaleString("tr-TR"),
      altDeger: trTutar(odemesiGelenCiro),
      aciklama: donemEtiketi,
      icon: Wallet,
      href: "/teklifler?grup=PARA_ALINDI",
      accent: "text-emerald-600 dark:text-emerald-400",
    },
    {
      baslik: "Aktif operasyon",
      deger: aktifOperasyonSayisi.toLocaleString("tr-TR"),
      aciklama: askidakiSayisi > 0 ? `${askidakiSayisi} askıda` : "Devam eden işler",
      icon: ClipboardList,
      href: "/operasyonlar?durum=aktif&aralik=TUMU",
      accent: askidakiSayisi > 0 ? "text-amber-600 dark:text-amber-400" : undefined,
    },
    {
      baslik: "Gündem",
      deger:
        (indirimOnayBekleyenSayisi + askidakiSayisi).toLocaleString("tr-TR"),
      aciklama:
        indirimOnayBekleyenSayisi > 0
          ? `${indirimOnayBekleyenSayisi} indirim onayı`
          : askidakiSayisi > 0
            ? `${askidakiSayisi} askıdaki operasyon`
            : "Bekleyen aksiyon yok",
      icon: AlertCircle,
      accent:
        indirimOnayBekleyenSayisi + askidakiSayisi > 0
          ? "text-rose-600 dark:text-rose-400"
          : undefined,
    },
  ];

  const tumBekleyenler =
    bekleyenDevirler.length +
    indirimOnayBekleyen.length +
    cevapBekleyenTeklifler.length +
    odemeBekleyenTeklifler.length +
    askidakiOperasyonlar.length +
    bekleyenOperasyonlar.length +
    hatirlatmaGorusmeler.length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">GENEL DURUM</h1>
          <p className="text-sm text-muted-foreground">
            Hoş geldin, <span className="font-medium text-foreground">{user.name}</span> · {ARALIK_ETIKET[aktifAralik]}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Firma, kişi, belge no ara..."
              className="w-64 pl-9"
              disabled
              title="Sprint 5'te aktif"
            />
          </div>

          <Tabs value={aktifAralik}>
            <TabsList>
              {ARALIK_LISTE.map((a) => (
                <TabsTrigger
                  key={a}
                  value={a}
                  render={<Link href={buildHref(a)} />}
                >
                  {ARALIK_ETIKET[a]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* ANA GRID: KPI + Bekleyenler */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* SOL — KPI'lar (2 kolon) */}
        <div className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {kpilar.map((k) => {
              const Icon = k.icon;
              const card = (
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardDescription>{k.baslik}</CardDescription>
                      <Icon
                        className={`size-4 shrink-0 ${k.accent ?? "text-muted-foreground"}`}
                      />
                    </div>
                    <CardTitle className={`text-2xl ${k.accent ?? ""}`}>
                      {k.deger}
                    </CardTitle>
                    {k.altDeger && (
                      <p
                        className={`text-sm font-medium tabular-nums ${k.accent ?? "text-foreground/80"}`}
                      >
                        {k.altDeger}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{k.aciklama}</p>
                  </CardContent>
                </Card>
              );
              return k.href ? (
                <Link key={k.baslik} href={k.href} className="block">
                  {card}
                </Link>
              ) : (
                <div key={k.baslik}>{card}</div>
              );
            })}
          </div>
        </div>

        {/* SAĞ — Bekleyenler paneli */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="size-4" />
                  Bekleyenler
                </CardTitle>
                {tumBekleyenler > 0 && (
                  <Badge variant="destructive">{tumBekleyenler}</Badge>
                )}
              </div>
              <CardDescription>Sistem genelinde aksiyon bekleyen kayıtlar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tumBekleyenler === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                  <Inbox className="size-8 opacity-30" />
                  <p className="text-sm">Bekleyen aksiyon yok</p>
                </div>
              ) : (
                <>
                  {bekleyenDevirler.length > 0 && (
                    <BekleyenGrup
                      baslik="Bekleyen iş devri"
                      sayi={bekleyenDevirler.length}
                      icon={Inbox}
                      tumHref="/is-devri?grup=BEKLEYEN"
                    >
                      {bekleyenDevirler.map((d) => {
                        const baslik =
                          d.gorusme?.konu ??
                          (d.teklif
                            ? `${d.teklif.belgeNo} — ${d.teklif.baslik}`
                            : d.operasyon
                              ? `${d.operasyon.teklif.belgeNo} — ${d.operasyon.teklif.baslik}`
                              : "—");
                        return (
                          <BekleyenSatir
                            key={d.id}
                            baslik={baslik}
                            altYazi={`${d.devreden.name} → ${d.devralan.name} · ${trGoreceli(d.createdAt)}`}
                            href="/is-devri?grup=BEKLEYEN"
                          />
                        );
                      })}
                    </BekleyenGrup>
                  )}

                  {indirimOnayBekleyen.length > 0 && (
                    <BekleyenGrup
                      baslik="İndirim onayı bekliyor"
                      sayi={indirimOnayBekleyen.length}
                      icon={ShieldCheck}
                      tumHref="/teklifler"
                    >
                      {indirimOnayBekleyen.map((t) => (
                        <BekleyenSatir
                          key={t.id}
                          baslik={`${t.belgeNo} — ${t.baslik}`}
                          altYazi={`${t.firma.ad} · %${t.indirimYuzde?.toString() ?? ""} · ${t.sorumlu.name}`}
                          href={`/teklifler/${t.id}`}
                        />
                      ))}
                    </BekleyenGrup>
                  )}

                  {cevapBekleyenTeklifler.length > 0 && (
                    <BekleyenGrup
                      baslik="Cevap bekleyen teklif"
                      sayi={cevapBekleyenTeklifler.length}
                      icon={FileText}
                      tumHref="/teklifler?grup=BEKLIYOR"
                    >
                      {cevapBekleyenTeklifler.map((t) => (
                        <BekleyenSatir
                          key={t.id}
                          baslik={`${t.belgeNo} — ${t.baslik}`}
                          altYazi={`${t.firma.ad} · ${t.sorumlu.name}${t.gonderilmeTar ? ` · gönderildi ${trGoreceli(t.gonderilmeTar)}` : ""}`}
                          href={`/teklifler/${t.id}`}
                        />
                      ))}
                    </BekleyenGrup>
                  )}

                  {odemeBekleyenTeklifler.length > 0 && (
                    <BekleyenGrup
                      baslik="Onaylandı · ödeme bekliyor"
                      sayi={odemeBekleyenTeklifler.length}
                      icon={CircleCheck}
                      tumHref="/teklifler?grup=ONAYLANDI"
                    >
                      {odemeBekleyenTeklifler.map((t) => (
                        <BekleyenSatir
                          key={t.id}
                          baslik={`${t.belgeNo} — ${t.baslik}`}
                          altYazi={`${t.firma.ad} · ${t.sorumlu.name} · ${trTutar(t.netTutar, t.paraBirimi)}${t.kabulTar ? ` · kabul ${trGoreceli(t.kabulTar)}` : ""}`}
                          href={`/teklifler/${t.id}`}
                        />
                      ))}
                    </BekleyenGrup>
                  )}

                  {bekleyenOperasyonlar.length > 0 && (
                    <BekleyenGrup
                      baslik="Başlamayı bekleyen operasyon"
                      sayi={bekleyenOperasyonlar.length}
                      icon={ClipboardList}
                      tumHref="/operasyonlar?durum=BEKLIYOR"
                    >
                      {bekleyenOperasyonlar.map((o) => (
                        <BekleyenSatir
                          key={o.id}
                          baslik={`${o.teklif.belgeNo} — ${o.teklif.baslik}`}
                          altYazi={`${o.teklif.firma.ad} · ${o.sorumlu.name} · açıldı ${trGoreceli(o.createdAt)}`}
                          href={`/operasyonlar/${o.id}`}
                        />
                      ))}
                    </BekleyenGrup>
                  )}

                  {askidakiOperasyonlar.length > 0 && (
                    <BekleyenGrup
                      baslik="Askıdaki operasyon"
                      sayi={askidakiOperasyonlar.length}
                      icon={Pause}
                      tumHref="/operasyonlar?durum=ASKIDA"
                    >
                      {askidakiOperasyonlar.map((o) => (
                        <BekleyenSatir
                          key={o.id}
                          baslik={`${o.teklif.belgeNo} — ${o.teklif.baslik}`}
                          altYazi={`${o.teklif.firma.ad} · ${o.sorumlu.name}${o.bekletmeNeden ? ` · ${o.bekletmeNeden}` : ""}`}
                          href={`/operasyonlar/${o.id}`}
                        />
                      ))}
                    </BekleyenGrup>
                  )}

                  {hatirlatmaGorusmeler.length > 0 && (
                    <BekleyenGrup
                      baslik="Hatırlatma vakti geçen"
                      sayi={hatirlatmaGorusmeler.length}
                      icon={CalendarClock}
                      tumHref="/gorusmeler"
                    >
                      {hatirlatmaGorusmeler.map((g) => (
                        <BekleyenSatir
                          key={g.id}
                          baslik={g.konu}
                          altYazi={`${g.firma.ad} · ${g.sorumlu.name}${g.hatirlatma ? ` · ${trTarihSaat(g.hatirlatma)}` : ""}`}
                          href={`/gorusmeler/${g.id}`}
                        />
                      ))}
                    </BekleyenGrup>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function BekleyenGrup({
  baslik,
  sayi,
  icon: Icon,
  tumHref,
  children,
}: {
  baslik: string;
  sayi: number;
  icon: React.ComponentType<{ className?: string }>;
  tumHref: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Icon className="size-3.5" />
          {baslik}
          <span className="text-foreground">({sayi})</span>
        </div>
        <Link href={tumHref} className="text-[11px] text-primary hover:underline">
          Tümü →
        </Link>
      </div>
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}

function BekleyenSatir({
  baslik,
  altYazi,
  href,
}: {
  baslik: string;
  altYazi: string;
  href: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="block rounded-md border bg-muted/30 px-2.5 py-1.5 text-xs transition-colors hover:bg-muted"
      >
        <p className="line-clamp-1 font-medium">{baslik}</p>
        <p className="line-clamp-1 text-[11px] text-muted-foreground">{altYazi}</p>
      </Link>
    </li>
  );
}
