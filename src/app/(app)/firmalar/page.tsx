import Link from "next/link";
import { Building2, ExternalLink } from "lucide-react";
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
          { vergiNo: { contains: q } },
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
        _count: { select: { gorusmeler: true, teklifler: true, kisiler: true } },
      },
    }),
    prisma.firma.count({ where }),
  ]);

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
              <TableHead>Sektör</TableHead>
              <TableHead>Şehir</TableHead>
              <TableHead className="text-right">Kişi</TableHead>
              <TableHead className="text-right">Görüşme</TableHead>
              <TableHead className="text-right">Teklif</TableHead>
              <TableHead>Eklenme</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {firmalar.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-32">
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
            {firmalar.map((f) => (
              <TableRow key={f.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <Link href={`/firmalar/${f.id}`} className="block">
                    <div className="font-medium">{f.ad}</div>
                    {f.vergiNo && (
                      <div className="text-xs text-muted-foreground">
                        VKN/TCN: {f.vergiNo}
                      </div>
                    )}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {f.sektor ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {f.sehir ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {f._count.kisiler > 0 ? f._count.kisiler : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {f._count.gorusmeler > 0 ? (
                    <Badge variant="secondary">{f._count.gorusmeler}</Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {f._count.teklifler > 0 ? (
                    <Badge variant="secondary">{f._count.teklifler}</Badge>
                  ) : (
                    "—"
                  )}
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
            ))}
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
