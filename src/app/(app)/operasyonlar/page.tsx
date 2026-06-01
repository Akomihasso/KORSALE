import Link from "next/link";
import { ClipboardList, Pause } from "lucide-react";
import type { OperasyonDurum, OperasyonKategori, Prisma } from "@prisma/client";

import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { guncelKurlar, tlyeCevir } from "@/lib/doviz-kuru";
import {
  OPERASYON_DURUM_ETIKET,
  OPERASYON_KATEGORI_ETIKET,
  operasyonDurumRengi,
  trTarih,
  trTutar,
} from "@/lib/format";
import { FirmaArama } from "@/components/firma-arama";
import { Sayfalama } from "@/components/sayfalama";
import {
  ARALIK_ETIKET,
  ARALIK_LISTE,
  aralikBaslangic,
  normalizeAralik,
  type Aralik,
} from "@/lib/zaman-araligi";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Operasyonlar" };

const SAYFA_BOYUTU = 20;

type SearchParams = Promise<{
  kategori?: OperasyonKategori;
  durum?: OperasyonDurum;
  aralik?: string;
  q?: string;
  sayfa?: string;
}>;

const KATEGORI_LISTE: OperasyonKategori[] = [
  "MARKA",
  "PATENT",
  "TASARIM",
  "DANISMANLIK",
  "DIGER",
];

const DURUM_LISTE: OperasyonDurum[] = [
  "BEKLIYOR",
  "DEVAM_EDIYOR",
  "ASKIDA",
  "TAMAMLANDI",
  "IPTAL",
];

function buildHref(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `/operasyonlar?${qs}` : "/operasyonlar";
}

export default async function OperasyonlarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAuth();
  const { kategori, durum, aralik, q, sayfa: sayfaParam } = await searchParams;
  const sayfa = Math.max(1, Number(sayfaParam) || 1);
  const aktifAralik: Aralik = normalizeAralik(aralik);
  const baslangic = aralikBaslangic(aktifAralik);

  const where: Prisma.OperasyonWhereInput = {
    ...(kategori ? { kategori } : {}),
    ...(durum ? { durum } : {}),
    ...(baslangic ? { createdAt: { gte: baslangic } } : {}),
    ...(q
      ? {
          OR: [
            { teklif: { belgeNo: { contains: q, mode: "insensitive" } } },
            { teklif: { baslik: { contains: q, mode: "insensitive" } } },
            { teklif: { firma: { ad: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };

  const [operasyonlar, toplam, kategoriSayilari, askidaSayisi, kurlar] = await Promise.all([
    prisma.operasyon.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (sayfa - 1) * SAYFA_BOYUTU,
      take: SAYFA_BOYUTU,
      select: {
        id: true,
        belgeNo: true,
        kategori: true,
        durum: true,
        ilerlemeYuzde: true,
        hedefBitisTar: true,
        bekletmeNeden: true,
        teklif: {
          select: {
            belgeNo: true,
            baslik: true,
            netTutar: true,
            paraBirimi: true,
            firma: { select: { id: true, ad: true } },
          },
        },
        sorumlu: { select: { name: true } },
      },
    }),
    prisma.operasyon.count({ where }),
    prisma.operasyon.groupBy({
      by: ["kategori"],
      _count: true,
      where: baslangic ? { createdAt: { gte: baslangic } } : undefined,
    }),
    prisma.operasyon.count({
      where: { durum: "ASKIDA", ...(baslangic ? { createdAt: { gte: baslangic } } : {}) },
    }),
    guncelKurlar(),
  ]);

  const sayim = (k: OperasyonKategori) =>
    (kategoriSayilari.find((g) => g.kategori === k)?._count as unknown as number) ?? 0;

  const tumKategoriToplam = kategoriSayilari.reduce(
    (acc, g) => acc + (g._count as unknown as number),
    0,
  );

  const sayfadakiToplamTutar = operasyonlar.reduce(
    (acc, o) =>
      acc + tlyeCevir(Number(o.teklif.netTutar ?? 0), o.teklif.paraBirimi, kurlar),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Operasyonlar</h1>
          <p className="text-sm text-muted-foreground">
            {aktifAralik === "HAFTA"
              ? "Bu hafta açılan"
              : aktifAralik === "AY"
                ? "Bu ay açılan"
                : "Tüm"}{" "}
            operasyonlar — toplam {toplam} kayıt
            {askidaSayisi > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Pause className="size-3" /> {askidaSayisi} askıda
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={aktifAralik}>
          <TabsList>
            {ARALIK_LISTE.map((a) => (
              <TabsTrigger
                key={a}
                value={a}
                render={
                  <Link href={buildHref({ kategori, durum, q, aralik: a })} />
                }
              >
                {ARALIK_ETIKET[a]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <FirmaArama placeholder="Belge no, başlık veya firma adı ara..." />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={buildHref({ durum, q, aralik: aktifAralik })}
          className={`text-xs rounded-full border px-3 py-1 transition-colors ${!kategori ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}
        >
          Tüm kategoriler ({tumKategoriToplam})
        </Link>
        {KATEGORI_LISTE.map((k) => (
          <Link
            key={k}
            href={buildHref({ durum, q, kategori: k, aralik: aktifAralik })}
            className={`text-xs rounded-full border px-3 py-1 transition-colors ${kategori === k ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}
          >
            {OPERASYON_KATEGORI_ETIKET[k]} ({sayim(k)})
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={buildHref({ kategori, q, aralik: aktifAralik })}
          className={`text-xs rounded-md border px-2.5 py-1 transition-colors ${!durum ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}
        >
          Tüm durumlar
        </Link>
        {DURUM_LISTE.map((d) => (
          <Link
            key={d}
            href={buildHref({ kategori, q, durum: d, aralik: aktifAralik })}
            className={`text-xs rounded-md border px-2.5 py-1 transition-colors ${durum === d ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}
          >
            {OPERASYON_DURUM_ETIKET[d]}
          </Link>
        ))}
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Belge No</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>İş</TableHead>
              <TableHead>Firma</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="w-32">İlerleme</TableHead>
              <TableHead>Sorumlu</TableHead>
              <TableHead className="text-right">Net Tutar</TableHead>
              <TableHead className="text-right">Hedef Bitiş</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operasyonlar.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="h-32">
                  <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                    <ClipboardList className="size-8 opacity-30" />
                    <p className="text-sm">
                      {q || kategori || durum
                        ? "Bu filtrelerle eşleşen operasyon yok"
                        : aktifAralik === "TUMU"
                          ? "Henüz operasyon yok. Bir teklif kabul edildiğinde otomatik açılacak (Sprint 4)."
                          : "Bu zaman aralığında operasyon yok."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {operasyonlar.map((o) => (
              <TableRow key={o.id} className="hover:bg-muted/50">
                <TableCell className="font-mono text-xs">
                  <Link href={`/operasyonlar/${o.id}`} className="hover:underline">
                    {o.belgeNo ?? o.teklif.belgeNo}
                  </Link>
                  {o.belgeNo && (
                    <p className="font-mono text-[10px] text-muted-foreground">
                      ← {o.teklif.belgeNo}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {OPERASYON_KATEGORI_ETIKET[o.kategori]}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs">
                  <Link
                    href={`/operasyonlar/${o.id}`}
                    className="block truncate font-medium hover:underline"
                  >
                    {o.teklif.baslik}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/firmalar/${o.teklif.firma.id}`}
                    className="hover:underline"
                  >
                    {o.teklif.firma.ad}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Badge variant={operasyonDurumRengi(o.durum)}>
                      {OPERASYON_DURUM_ETIKET[o.durum]}
                    </Badge>
                    {o.durum === "ASKIDA" && o.bekletmeNeden && (
                      <p
                        className="line-clamp-1 text-[11px] text-muted-foreground"
                        title={o.bekletmeNeden}
                      >
                        ↳ {o.bekletmeNeden}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Progress value={o.ilerlemeYuzde} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground">
                      %{o.ilerlemeYuzde}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {o.sorumlu.name}
                </TableCell>
                <TableCell className="text-right text-xs font-medium">
                  {trTutar(o.teklif.netTutar, o.teklif.paraBirimi)}
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {o.hedefBitisTar ? trTarih(o.hedefBitisTar) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          {operasyonlar.length > 0 && (
            <tfoot className="border-t bg-muted/30">
              <tr>
                <td colSpan={7} className="px-4 py-2.5 text-xs font-medium text-muted-foreground">
                  Sayfadaki {operasyonlar.length} operasyon · toplam {toplam} kayıt
                </td>
                <td className="px-4 py-2.5 text-right text-xs font-semibold">
                  {trTutar(sayfadakiToplamTutar)}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </Table>
      </div>

      <Sayfalama
        toplam={toplam}
        sayfa={sayfa}
        sayfaBoyutu={SAYFA_BOYUTU}
        baseHref={buildHref({ kategori, durum, q, aralik: aktifAralik })}
      />
    </div>
  );
}
