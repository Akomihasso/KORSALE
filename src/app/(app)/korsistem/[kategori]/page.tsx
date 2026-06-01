import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, FileText, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  KORSISTEM_KATEGORI,
  dosyaBoyutOku,
  slugdanKategori,
} from "@/lib/korsistem";
import { dokumanSilAction } from "@/lib/actions/dokuman-actions";
import { DokumanYukleDialog } from "@/components/dokuman-yukle-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserRole } from "@prisma/client";

type Params = Promise<{ kategori: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { kategori: slug } = await params;
  const kat = slugdanKategori(slug);
  return { title: kat ? KORSISTEM_KATEGORI[kat].baslik : "KORSİSTEM" };
}

export default async function KorsistemKategoriPage({
  params,
}: {
  params: Params;
}) {
  const user = await requireAuth();
  const { kategori: slug } = await params;
  const kategori = slugdanKategori(slug);
  if (!kategori) notFound();

  const bilgi = KORSISTEM_KATEGORI[kategori];
  const Icon = bilgi.icon;
  const yonetici = user.role === UserRole.YONETICI;

  const dokumanlar = await prisma.dokuman.findMany({
    where: { kategori, aktif: true },
    orderBy: [{ kod: "asc" }, { revizyon: "asc" }],
    include: { yukleyen: { select: { name: true } } },
  });

  return (
    <div className="space-y-6">
      <Link
        href="/korsistem"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> KORSİSTEM
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{bilgi.baslik}</h1>
            <p className="text-sm text-muted-foreground">{bilgi.aciklama}</p>
          </div>
        </div>
        {yonetici && (
          <DokumanYukleDialog kategori={kategori} kategoriEtiket={bilgi.baslik} />
        )}
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Doküman</TableHead>
              <TableHead>Yükleyen</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Boyut</TableHead>
              <TableHead className="text-right">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dokumanlar.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-32">
                  <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                    <FileText className="size-8 opacity-30" />
                    <p className="text-sm">
                      Henüz doküman yok.
                      {yonetici && " Sağ üstten ekleyin."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {dokumanlar.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <div className="space-y-0.5">
                    <p className="font-medium">
                      <span className="font-mono text-xs text-muted-foreground">
                        {d.kod}-{d.revizyon}
                      </span>{" "}
                      {d.baslik}
                    </p>
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {d.dosyaTipi}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {d.yukleyen.name}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {format(d.createdAt, "dd.MM.yyyy", { locale: tr })}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {dosyaBoyutOku(d.dosyaBoyut)}
                </TableCell>
                <TableCell className="flex items-center justify-end gap-1">
                  <a href={d.dosyaUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Download className="size-3.5" /> Aç
                    </Button>
                  </a>
                  {yonetici && (
                    <form action={dokumanSilAction}>
                      <input type="hidden" name="id" value={d.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </form>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
