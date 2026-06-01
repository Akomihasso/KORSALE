import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import type { BelgeDurum, BelgeTipi, Prisma } from "@prisma/client";

import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { guncelKurlar, tlyeCevir } from "@/lib/doviz-kuru";
import {
  BELGE_TIPI_ETIKET,
  TEKLIF_ASAMA_ETIKET,
  TEKLIF_DURUM_GORUNUM,
  belgeTipiRengi,
  kabulOlasilikRengi,
  teklifAsamaRengi,
  teklifAsamasi,
  trTarih,
  trTutar,
} from "@/lib/format";
import { FirmaArama } from "@/components/firma-arama";
import { Sayfalama } from "@/components/sayfalama";
import { TeklifListeSatir } from "@/components/teklif-liste-satir";
import {
  ARALIK_ETIKET,
  ARALIK_LISTE,
  aralikBaslangic,
  normalizeAralik,
  type Aralik,
} from "@/lib/zaman-araligi";
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

export const metadata = { title: "Teklifler" };

const SAYFA_BOYUTU = 20;

type DurumGrubu =
  | "TUMU"
  | "BEKLIYOR" // Teklif bekliyor (gönderildi/beklemede + indirim onayı + taslak)
  | "ONAY_BEKLIYOR_INDIRIM" // sadece indirim onay
  | "ONAYLANDI" // KABUL & ödeme bekliyor
  | "PARA_ALINDI" // KABUL & odemeAlindi (operasyon yok/varsa devam)
  | "REDDEDILDI"
  | "IPTAL";

type SearchParams = Promise<{
  grup?: DurumGrubu;
  tip?: BelgeTipi;
  aralik?: string;
  q?: string;
  sayfa?: string;
}>;

// Server tarafında where filtresine çevrilebilen, durum + odemeAlindiTar
// kombinasyonu kullanan grup tanımları.
function grupWhere(grup: DurumGrubu | undefined): Prisma.TeklifWhereInput {
  switch (grup) {
    case "BEKLIYOR":
      return { durum: { in: ["TASLAK", "GONDERILDI", "BEKLEMEDE"] } };
    case "ONAY_BEKLIYOR_INDIRIM":
      return { durum: "ONAY_BEKLIYOR" };
    case "ONAYLANDI":
      return { durum: "KABUL", odemeAlindiTar: null };
    case "PARA_ALINDI":
      return { durum: "KABUL", odemeAlindiTar: { not: null } };
    case "REDDEDILDI":
      return { durum: "REDDEDILDI" };
    case "IPTAL":
      return { durum: { in: ["IPTAL", "SURESI_DOLDU"] } };
    case "TUMU":
    default:
      return {};
  }
}

const GRUP_ETIKET: Record<DurumGrubu, string> = {
  TUMU: "Tümü",
  BEKLIYOR: "Teklif bekliyor",
  ONAY_BEKLIYOR_INDIRIM: "İndirim onayı",
  ONAYLANDI: "Onaylandı · ödeme bekliyor",
  PARA_ALINDI: "Para alındı · operasyonda",
  REDDEDILDI: "Reddedildi",
  IPTAL: "İptal",
};

const BELGE_TIPI_LISTE: BelgeTipi[] = ["TEKLIF", "TALIMAT", "SOZLESME"];

function buildHref(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `/teklifler?${qs}` : "/teklifler";
}

export default async function TekliflerPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAuth();
  const { grup, tip, aralik, q, sayfa: sayfaParam } = await searchParams;
  const sayfa = Math.max(1, Number(sayfaParam) || 1);
  const aktifGrup: DurumGrubu = grup ?? "TUMU";
  const aktifAralik: Aralik = normalizeAralik(aralik);
  const tarihBaslangic = aralikBaslangic(aktifAralik);

  const where: Prisma.TeklifWhereInput = {
    ...grupWhere(aktifGrup),
    ...(tip ? { belgeTipi: tip } : {}),
    ...(tarihBaslangic ? { createdAt: { gte: tarihBaslangic } } : {}),
    ...(q
      ? {
          OR: [
            { belgeNo: { contains: q, mode: "insensitive" } },
            { baslik: { contains: q, mode: "insensitive" } },
            { firma: { ad: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const tarihSart = tarihBaslangic ? { createdAt: { gte: tarihBaslangic } } : {};

  const [
    teklifler,
    toplam,
    sayimBekliyor,
    sayimIndirimOnay,
    sayimOnaylandi,
    sayimParaAlindi,
    sayimRed,
    sayimIptal,
    sayimTum,
    kurlar,
  ] = await Promise.all([
    prisma.teklif.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (sayfa - 1) * SAYFA_BOYUTU,
      take: SAYFA_BOYUTU,
      include: {
        firma: { select: { id: true, ad: true } },
        sorumlu: { select: { name: true } },
        operasyon: { select: { durum: true } },
      },
    }),
    prisma.teklif.count({ where }),
    prisma.teklif.count({ where: { ...grupWhere("BEKLIYOR"), ...tarihSart } }),
    prisma.teklif.count({
      where: { ...grupWhere("ONAY_BEKLIYOR_INDIRIM"), ...tarihSart },
    }),
    prisma.teklif.count({ where: { ...grupWhere("ONAYLANDI"), ...tarihSart } }),
    prisma.teklif.count({ where: { ...grupWhere("PARA_ALINDI"), ...tarihSart } }),
    prisma.teklif.count({ where: { ...grupWhere("REDDEDILDI"), ...tarihSart } }),
    prisma.teklif.count({ where: { ...grupWhere("IPTAL"), ...tarihSart } }),
    prisma.teklif.count({ where: tarihSart }),
    guncelKurlar(),
  ]);

  const grupSayimlari: Record<DurumGrubu, number> = {
    TUMU: sayimTum,
    BEKLIYOR: sayimBekliyor,
    ONAY_BEKLIYOR_INDIRIM: sayimIndirimOnay,
    ONAYLANDI: sayimOnaylandi,
    PARA_ALINDI: sayimParaAlindi,
    REDDEDILDI: sayimRed,
    IPTAL: sayimIptal,
  };

  const sayfadakiNetTutar = teklifler.reduce(
    (acc, t) => acc + tlyeCevir(Number(t.netTutar ?? 0), t.paraBirimi, kurlar),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Teklifler</h1>
          <p className="text-sm text-muted-foreground">
            {ARALIK_ETIKET[aktifAralik]} · toplam {toplam} kayıt
            {q ? ` (arama: "${q}")` : ""}
          </p>
        </div>
        <Button render={<Link href="/teklifler/yeni" />}>
          <Plus className="size-4" /> Yeni Teklif
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={aktifAralik}>
          <TabsList>
            {ARALIK_LISTE.map((a) => (
              <TabsTrigger
                key={a}
                value={a}
                render={<Link href={buildHref({ grup, tip, q, aralik: a })} />}
              >
                {ARALIK_ETIKET[a]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <FirmaArama placeholder="Belge no, başlık veya firma adı ara..." />
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            "TUMU",
            "BEKLIYOR",
            "ONAY_BEKLIYOR_INDIRIM",
            "ONAYLANDI",
            "PARA_ALINDI",
            "REDDEDILDI",
            "IPTAL",
          ] as DurumGrubu[]
        ).map((g) => {
          const aktif = (aktifGrup ?? "TUMU") === g;
          return (
            <Link
              key={g}
              href={buildHref({
                tip,
                q,
                grup: g === "TUMU" ? undefined : g,
                aralik: aktifAralik,
              })}
              className={`text-xs rounded-md border px-2.5 py-1 transition-colors ${
                aktif
                  ? "border-primary bg-primary/10 text-primary"
                  : "hover:bg-muted"
              }`}
            >
              {GRUP_ETIKET[g]} ({grupSayimlari[g]})
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={buildHref({ grup, q, aralik: aktifAralik })}
          className={`text-xs rounded-full border px-3 py-1 transition-colors ${!tip ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}
        >
          Tüm tipler
        </Link>
        {BELGE_TIPI_LISTE.map((t) => (
          <Link
            key={t}
            href={buildHref({ grup, q, tip: t, aralik: aktifAralik })}
            className={`text-xs rounded-full border px-3 py-1 transition-colors ${tip === t ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}
          >
            {BELGE_TIPI_ETIKET[t]}
          </Link>
        ))}
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Belge No</TableHead>
              <TableHead>Tip</TableHead>
              <TableHead>Başlık</TableHead>
              <TableHead>Firma</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Sorumlu</TableHead>
              <TableHead className="text-right">Net</TableHead>
              <TableHead className="text-right">Olasılık</TableHead>
              <TableHead className="text-right">Tarih</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teklifler.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="h-32">
                  <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                    <FileText className="size-8 opacity-30" />
                    <p className="text-sm">
                      {q || tip || grup
                        ? "Bu filtrelerle eşleşen belge yok"
                        : "Henüz teklif yok. Sağ üstten yeni teklif oluşturun."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {teklifler.map((t) => {
              const asama = teklifAsamasi({
                durum: t.durum,
                odemeAlindiTar: t.odemeAlindiTar,
                operasyonDurum: t.operasyon?.durum ?? null,
              });
              const gorunum = TEKLIF_DURUM_GORUNUM[asama];
              return (
              <TeklifListeSatir key={t.id} teklifId={t.id}>
                <TableCell className="font-mono text-xs">{t.belgeNo}</TableCell>
                <TableCell>
                  <Badge variant={belgeTipiRengi(t.belgeTipi)}>
                    {BELGE_TIPI_ETIKET[t.belgeTipi]}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs">
                  <span className="block truncate font-medium">{t.baslik}</span>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/firmalar/${t.firma.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:underline"
                  >
                    {t.firma.ad}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={teklifAsamaRengi(asama)} className={gorunum.sinif}>
                    {TEKLIF_ASAMA_ETIKET[asama]}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {t.sorumlu.name}
                </TableCell>
                <TableCell className="text-right text-xs font-medium">
                  {trTutar(t.netTutar, t.paraBirimi)}
                </TableCell>
                <TableCell
                  className={`text-right text-xs font-medium ${kabulOlasilikRengi(t.kabulOlasilik)}`}
                >
                  %{t.kabulOlasilik}
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {trTarih(t.createdAt)}
                </TableCell>
              </TeklifListeSatir>
              );
            })}
          </TableBody>
          {teklifler.length > 0 && (
            <tfoot className="border-t bg-muted/30">
              <tr>
                <td colSpan={6} className="px-4 py-2.5 text-xs font-medium text-muted-foreground">
                  Sayfadaki {teklifler.length} kayıt · toplam {toplam}
                </td>
                <td className="px-4 py-2.5 text-right text-xs font-semibold">
                  {trTutar(sayfadakiNetTutar)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </Table>
      </div>

      <Sayfalama
        toplam={toplam}
        sayfa={sayfa}
        sayfaBoyutu={SAYFA_BOYUTU}
        baseHref={buildHref({ grup, tip, q, aralik: aktifAralik })}
      />
    </div>
  );
}
