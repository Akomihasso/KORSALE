import Link from "next/link";
import { Building2, ClipboardList, ExternalLink, FileText, MessageSquare } from "lucide-react";
import type { Prisma } from "@prisma/client";

import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { trTarih } from "@/lib/format";
import { FirmaArama } from "@/components/firma-arama";
import { FirmaFormDialog } from "@/components/firma-form-dialog";
import { Sayfalama } from "@/components/sayfalama";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Firmalar" };

const SAYFA_BOYUTU = 20;

const AKTIF_TEKLIF_DURUMLARI = [
  "TASLAK",
  "ONAY_BEKLIYOR",
  "GONDERILDI",
  "BEKLEMEDE",
] as const;

const AKTIF_OPERASYON_DURUMLARI = ["BEKLIYOR", "DEVAM_EDIYOR", "ASKIDA"] as const;

type SearchParams = Promise<{ q?: string; sayfa?: string }>;

export default async function FirmalarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAuth();
  const { q, sayfa: sayfaParam } = await searchParams;
  const sayfa = Math.max(1, Number(sayfaParam) || 1);

  const where: Prisma.FirmaWhereInput = q
    ? {
        OR: [
          { ad: { contains: q, mode: "insensitive" } },
          { sektor: { contains: q, mode: "insensitive" } },
          { sehir: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [firmalar, toplam] = await Promise.all([
    prisma.firma.findMany({
      where,
      orderBy: { ad: "asc" },
      skip: (sayfa - 1) * SAYFA_BOYUTU,
      take: SAYFA_BOYUTU,
      include: {
        _count: {
          select: {
            kisiler: true,
            gorusmeler: { where: { durum: "ACIK" } },
            teklifler: { where: { durum: { in: [...AKTIF_TEKLIF_DURUMLARI] } } },
          },
        },
        gorusmeler: {
          where: { durum: "ACIK" },
          orderBy: { tarih: "desc" },
          take: 1,
          select: {
            tarih: true,
            sorumlu: { select: { id: true, name: true } },
          },
        },
        teklifler: {
          where: { durum: { in: [...AKTIF_TEKLIF_DURUMLARI] } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            createdAt: true,
            sorumlu: { select: { id: true, name: true } },
            operasyon: {
              select: {
                durum: true,
              },
            },
          },
        },
      },
    }),
    prisma.firma.count({ where }),
  ]);

  // Sayfadaki firmalar için aktif operasyon sayılarını topla
  const firmaIds = firmalar.map((f) => f.id);
  const aktifOperasyonlar =
    firmaIds.length > 0
      ? await prisma.operasyon.findMany({
          where: {
            durum: { in: [...AKTIF_OPERASYON_DURUMLARI] },
            teklif: { firmaId: { in: firmaIds } },
          },
          select: { teklif: { select: { firmaId: true } } },
        })
      : [];

  const opSayim = new Map<string, number>();
  for (const o of aktifOperasyonlar) {
    const fId = o.teklif.firmaId;
    opSayim.set(fId, (opSayim.get(fId) ?? 0) + 1);
  }

  const baseHref = q ? `/firmalar?q=${encodeURIComponent(q)}` : "/firmalar";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Firmalar</h1>
          <p className="text-sm text-muted-foreground">
            Toplam {toplam} firma{q ? ` (arama: "${q}")` : ""}
          </p>
        </div>
        <FirmaFormDialog mode="create" />
      </div>

      <FirmaArama />

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Firma</TableHead>
              <TableHead>Sektör · Şehir</TableHead>
              <TableHead>İlgilenen</TableHead>
              <TableHead>Aktif iş</TableHead>
              <TableHead className="text-right">Kişi</TableHead>
              <TableHead>Eklenme</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {firmalar.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-32">
                  <div className="flex flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                    <Building2 className="size-8 opacity-30" />
                    <p className="text-sm">
                      {q
                        ? `"${q}" için sonuç bulunamadı`
                        : "Henüz firma yok. Sağ üstten yeni firma ekleyin."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {firmalar.map((f) => {
              const sonAktifGorusme = f.gorusmeler[0];
              const sonAktifTeklif = f.teklifler[0];
              // En son hareket: görüşme tarihi vs teklif createdAt karşılaştır
              const ilgilenen = (() => {
                if (sonAktifGorusme && sonAktifTeklif) {
                  return sonAktifGorusme.tarih > sonAktifTeklif.createdAt
                    ? sonAktifGorusme.sorumlu
                    : sonAktifTeklif.sorumlu;
                }
                return sonAktifGorusme?.sorumlu ?? sonAktifTeklif?.sorumlu ?? null;
              })();

              const aktifGorusme = f._count.gorusmeler;
              const aktifTeklif = f._count.teklifler;
              const aktifOperasyon = opSayim.get(f.id) ?? 0;
              const hicAktifYok =
                aktifGorusme === 0 && aktifTeklif === 0 && aktifOperasyon === 0;

              return (
                <TableRow key={f.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link href={`/firmalar/${f.id}`} className="block">
                      <div className="font-medium">{f.ad}</div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {[f.sektor, f.sehir].filter(Boolean).join(" · ") || "—"}
                  </TableCell>
                  <TableCell>
                    {ilgilenen ? (
                      <span className="text-sm">{ilgilenen.name}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {hicAktifYok ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {aktifGorusme > 0 && (
                          <Badge
                            variant="secondary"
                            className="gap-1 font-normal"
                            title="Açık görüşme"
                          >
                            <MessageSquare className="size-3" />
                            {aktifGorusme}
                          </Badge>
                        )}
                        {aktifTeklif > 0 && (
                          <Badge
                            variant="secondary"
                            className="gap-1 font-normal"
                            title="Aktif teklif"
                          >
                            <FileText className="size-3" />
                            {aktifTeklif}
                          </Badge>
                        )}
                        {aktifOperasyon > 0 && (
                          <Badge
                            variant="default"
                            className="gap-1 font-normal"
                            title="Devam eden operasyon"
                          >
                            <ClipboardList className="size-3" />
                            {aktifOperasyon}
                          </Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {f._count.kisiler > 0 ? f._count.kisiler : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {trTarih(f.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/firmalar/${f.id}`}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="size-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Sayfalama
        toplam={toplam}
        sayfa={sayfa}
        sayfaBoyutu={SAYFA_BOYUTU}
        baseHref={baseHref}
      />
    </div>
  );
}
