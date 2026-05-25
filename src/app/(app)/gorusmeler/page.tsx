import Link from "next/link";
import { MessageSquare, Plus } from "lucide-react";
import type { GorusmeSonuc, Prisma } from "@prisma/client";

import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  GORUSME_DURUM_ETIKET,
  GORUSME_SONUC_ETIKET,
  GORUSME_TIPI_ETIKET,
  gorusmeDurumRengi,
  gorusmeSonucRengi,
  trTarihSaat,
  trTutar,
} from "@/lib/format";
import { FirmaArama } from "@/components/firma-arama";
import { Sayfalama } from "@/components/sayfalama";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Görüşmeler" };

const SAYFA_BOYUTU = 20;

type SearchParams = Promise<{
  durum?: "ACIK" | "KAPALI";
  sonuc?: GorusmeSonuc;
  q?: string;
  sayfa?: string;
}>;

const GORUSME_SONUC_DEGERLER: GorusmeSonuc[] = [
  "TEKLIF_ISTENDI",
  "BILGI_VERILDI",
  "ILGISIZ",
  "ERTELENDI",
  "REDDEDILDI",
  "TEKRAR_ARANACAK",
];

function buildHref(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `/gorusmeler?${qs}` : "/gorusmeler";
}

export default async function GorusmelerPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAuth();
  const { durum, sonuc, q, sayfa: sayfaParam } = await searchParams;
  const sayfa = Math.max(1, Number(sayfaParam) || 1);

  const where: Prisma.GorusmeWhereInput = {
    ...(durum ? { durum } : {}),
    ...(sonuc ? { sonuc } : {}),
    ...(q
      ? {
          OR: [
            { konu: { contains: q, mode: "insensitive" } },
            { ozet: { contains: q, mode: "insensitive" } },
            { firma: { ad: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [gorusmeler, toplam, durumSayilari] = await Promise.all([
    prisma.gorusme.findMany({
      where,
      orderBy: { tarih: "desc" },
      skip: (sayfa - 1) * SAYFA_BOYUTU,
      take: SAYFA_BOYUTU,
      include: {
        firma: { select: { id: true, ad: true } },
        sorumlu: { select: { name: true } },
      },
    }),
    prisma.gorusme.count({ where }),
    prisma.gorusme.groupBy({
      by: ["durum"],
      _count: true,
      where: {
        ...(sonuc ? { sonuc } : {}),
        ...(q
          ? {
              OR: [
                { konu: { contains: q, mode: "insensitive" } },
                { ozet: { contains: q, mode: "insensitive" } },
                { firma: { ad: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
    }),
  ]);

  const acikSayisi = durumSayilari.find((d) => d.durum === "ACIK")?._count ?? 0;
  const kapaliSayisi = durumSayilari.find((d) => d.durum === "KAPALI")?._count ?? 0;
  const tumSayisi = acikSayisi + kapaliSayisi;

  const aktifDurum: "TUMU" | "ACIK" | "KAPALI" = durum ?? "TUMU";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Görüşmeler</h1>
          <p className="text-sm text-muted-foreground">
            Toplam {toplam} görüşme{q ? ` (arama: "${q}")` : ""}
          </p>
        </div>
        <Button render={<Link href="/gorusmeler/yeni" />}>
          <Plus className="size-4" /> Yeni Görüşme
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={aktifDurum}>
          <TabsList>
            <TabsTrigger value="TUMU" render={<Link href={buildHref({ q, sonuc })} />}>
              Tümü ({tumSayisi})
            </TabsTrigger>
            <TabsTrigger
              value="ACIK"
              render={<Link href={buildHref({ durum: "ACIK", q, sonuc })} />}
            >
              Açık ({acikSayisi})
            </TabsTrigger>
            <TabsTrigger
              value="KAPALI"
              render={<Link href={buildHref({ durum: "KAPALI", q, sonuc })} />}
            >
              Kapalı ({kapaliSayisi})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <FirmaArama placeholder="Görüşme konusu, özeti veya firma adı ara..." />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={buildHref({ durum, q })}
          className={`text-xs rounded-full border px-3 py-1 transition-colors ${!sonuc ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}
        >
          Tüm sonuçlar
        </Link>
        {GORUSME_SONUC_DEGERLER.map((s) => (
          <Link
            key={s}
            href={buildHref({ durum, q, sonuc: s })}
            className={`text-xs rounded-full border px-3 py-1 transition-colors ${sonuc === s ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}
          >
            {GORUSME_SONUC_ETIKET[s]}
          </Link>
        ))}
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih</TableHead>
              <TableHead>Firma</TableHead>
              <TableHead>Konu</TableHead>
              <TableHead>Tip</TableHead>
              <TableHead>Sonuç</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Sorumlu</TableHead>
              <TableHead className="text-right">Tahmini</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gorusmeler.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-32">
                  <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                    <MessageSquare className="size-8 opacity-30" />
                    <p className="text-sm">
                      {q || sonuc || durum
                        ? "Bu filtrelerle eşleşen görüşme yok"
                        : "Henüz görüşme yok. Sağ üstten yeni görüşme ekleyin."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {gorusmeler.map((g) => (
              <TableRow key={g.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="text-xs text-muted-foreground">
                  <Link href={`/gorusmeler/${g.id}`} className="block">
                    {trTarihSaat(g.tarih)}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/firmalar/${g.firma.id}`}
                    className="hover:underline"
                  >
                    {g.firma.ad}
                  </Link>
                </TableCell>
                <TableCell className="max-w-xs">
                  <Link
                    href={`/gorusmeler/${g.id}`}
                    className="block truncate font-medium hover:underline"
                  >
                    {g.konu}
                  </Link>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {GORUSME_TIPI_ETIKET[g.tip]}
                </TableCell>
                <TableCell>
                  <Badge variant={gorusmeSonucRengi(g.sonuc)}>
                    {GORUSME_SONUC_ETIKET[g.sonuc]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={gorusmeDurumRengi(g.durum)}>
                    {GORUSME_DURUM_ETIKET[g.durum]}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {g.sorumlu.name}
                </TableCell>
                <TableCell className="text-right text-xs">
                  {trTutar(g.tahminiTutar)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sayfalama
        toplam={toplam}
        sayfa={sayfa}
        sayfaBoyutu={SAYFA_BOYUTU}
        baseHref={buildHref({ durum, sonuc, q })}
      />
    </div>
  );
}
