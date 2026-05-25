import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
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

export const metadata = { title: "Sistem Parametreleri" };

const AYAR_ETIKETLERI: Record<string, string> = {
  indirim_onay_yuzde: "İndirim onay eşiği (%)",
  devir_otomatik_kabul_saat: "Devir otomatik kabul süresi (saat)",
  devir_geri_alma_saat: "Devir geri alma süresi (saat)",
  devir_notu_min_karakter: "Devir notu minimum karakter",
  belge_no_format: "Belge numarası formatı",
  firma_adi: "Firma adı",
};

export default async function SistemAyarlariPage() {
  await requireRole(UserRole.YONETICI);

  const ayarlar = await prisma.ayar.findMany({
    orderBy: { anahtar: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Sistem Parametreleri
        </h1>
        <p className="text-sm text-muted-foreground">
          Düzenleme arayüzü Sprint 6{"'"}da eklenecek — şimdilik salt-görüntüleme
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mevcut ayarlar</CardTitle>
          <CardDescription>
            Bu değerler `prisma/seed.ts` üzerinden ilk defa kuruluyor; veritabanından
            elle güncellenebilir
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parametre</TableHead>
                <TableHead>Anahtar</TableHead>
                <TableHead>Değer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ayarlar.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Henüz ayar yok. `npm run db:seed` çalıştırın.
                  </TableCell>
                </TableRow>
              )}
              {ayarlar.map((a) => (
                <TableRow key={a.anahtar}>
                  <TableCell className="font-medium">
                    {AYAR_ETIKETLERI[a.anahtar] ?? a.anahtar}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {a.anahtar}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{a.deger}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
