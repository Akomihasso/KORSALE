import Link from "next/link";
import { FileSpreadsheet, FileText, Filter } from "lucide-react";

import { requireAuth } from "@/lib/auth-helpers";
import { RAPOR_BASLIK, raporUret, type RaporTipi } from "@/lib/raporlar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Raporlar" };

const GECERLI_TIPLER: RaporTipi[] = ["gorusme", "teklif", "operasyon", "ekip"];

type SearchParams = Promise<{
  tip?: string;
  baslangic?: string;
  bitis?: string;
}>;

function tarihGirisiDegeri(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function baslangicVarsayilan(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function bitisVarsayilan(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export default async function RaporlarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAuth();
  const { tip, baslangic, bitis } = await searchParams;

  const seciliTip: RaporTipi | null =
    tip && GECERLI_TIPLER.includes(tip as RaporTipi) ? (tip as RaporTipi) : null;
  const seciliBaslangic = baslangic ? new Date(baslangic) : baslangicVarsayilan();
  const seciliBitis = bitis ? new Date(bitis) : bitisVarsayilan();

  const rapor = seciliTip
    ? await raporUret(seciliTip, seciliBaslangic, seciliBitis)
    : null;

  const exportQuery = seciliTip
    ? new URLSearchParams({
        tip: seciliTip,
        baslangic: tarihGirisiDegeri(seciliBaslangic),
        bitis: tarihGirisiDegeri(seciliBitis),
      }).toString()
    : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Raporlar</h1>
        <p className="text-sm text-muted-foreground">
          Tarih aralığı ve tip seçin — PDF veya Word olarak indirin
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Filter className="size-4" />
            <CardTitle className="text-base">Filtre</CardTitle>
          </div>
          <CardDescription>
            Rapor tipini seçin, tarih aralığı belirleyin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form method="get" className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <label htmlFor="tip" className="text-xs font-medium">
                Rapor tipi
              </label>
              <select
                id="tip"
                name="tip"
                defaultValue={seciliTip ?? "teklif"}
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
              >
                {GECERLI_TIPLER.map((t) => (
                  <option key={t} value={t}>
                    {RAPOR_BASLIK[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="baslangic" className="text-xs font-medium">
                Başlangıç
              </label>
              <input
                id="baslangic"
                name="baslangic"
                type="date"
                defaultValue={tarihGirisiDegeri(seciliBaslangic)}
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="bitis" className="text-xs font-medium">
                Bitiş
              </label>
              <input
                id="bitis"
                name="bitis"
                type="date"
                defaultValue={tarihGirisiDegeri(seciliBitis)}
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Raporu Getir
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {rapor && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
            <div>
              <CardTitle className="text-base">{rapor.baslik}</CardTitle>
              <CardDescription>
                {rapor.donem} · {rapor.satirlar.length} kayıt
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <a href={`/api/raporlar/pdf?${exportQuery}`}>
                <Button variant="outline" size="sm" className="gap-1">
                  <FileText className="size-3.5" /> PDF
                </Button>
              </a>
              <a href={`/api/raporlar/docx?${exportQuery}`}>
                <Button variant="outline" size="sm" className="gap-1">
                  <FileSpreadsheet className="size-3.5" /> Word
                </Button>
              </a>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {rapor.sutunlar.map((s) => (
                      <TableHead key={s} className="text-xs">
                        {s}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rapor.satirlar.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={rapor.sutunlar.length}
                        className="h-24 text-center text-sm text-muted-foreground"
                      >
                        Bu tarih aralığında kayıt yok
                      </TableCell>
                    </TableRow>
                  )}
                  {rapor.satirlar.map((sat, i) => (
                    <TableRow key={i}>
                      {sat.map((h, j) => (
                        <TableCell key={j} className="text-xs">
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {rapor.ozet && rapor.ozet.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                {rapor.ozet.map((o) => (
                  <div
                    key={o.etiket}
                    className="rounded-md border bg-muted/30 px-3 py-1.5"
                  >
                    <span className="text-muted-foreground">{o.etiket}:</span>{" "}
                    <span className="font-medium">{o.deger}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!rapor && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            <p>Yukarıdan bir rapor tipi seçin ve &quot;Raporu Getir&quot; tuşuna basın.</p>
            <p className="mt-2">
              Hazır rapor tipleri:{" "}
              {GECERLI_TIPLER.map((t) => (
                <Link
                  key={t}
                  href={`/raporlar?tip=${t}&baslangic=${tarihGirisiDegeri(baslangicVarsayilan())}&bitis=${tarihGirisiDegeri(bitisVarsayilan())}`}
                  className="mx-1 text-primary hover:underline"
                >
                  {RAPOR_BASLIK[t]}
                </Link>
              ))}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
