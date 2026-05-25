import { format } from "date-fns";
import { tr } from "date-fns/locale";

import { requireRole, ROL_ETIKETLERI } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { kullaniciAktiflikAction } from "@/lib/actions/kullanici-actions";
import { UserRole } from "@prisma/client";
import { KullaniciFormDialog } from "@/components/kullanici-form-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Kullanıcılar" };

const ROL_BADGE: Record<UserRole, "default" | "secondary" | "outline"> = {
  YONETICI: "default",
  SATIS: "secondary",
  OPERASYON: "secondary",
  GOZLEMCI: "outline",
};

export default async function KullanicilarPage() {
  await requireRole(UserRole.YONETICI);

  const kullanicilar = await prisma.user.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kullanıcılar</h1>
          <p className="text-sm text-muted-foreground">
            Toplam {kullanicilar.length} kullanıcı
          </p>
        </div>
        <KullaniciFormDialog mode="create" />
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad Soyad</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Oluşturma</TableHead>
              <TableHead className="w-24 text-right">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kullanicilar.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Henüz kullanıcı yok. Sağ üstten yeni kullanıcı ekleyin.
                </TableCell>
              </TableRow>
            )}
            {kullanicilar.map((k) => (
              <TableRow key={k.id}>
                <TableCell className="font-medium">{k.name}</TableCell>
                <TableCell className="text-muted-foreground">{k.email}</TableCell>
                <TableCell>
                  <Badge variant={ROL_BADGE[k.role]}>{ROL_ETIKETLERI[k.role]}</Badge>
                </TableCell>
                <TableCell>
                  {k.isActive ? (
                    <Badge variant="outline" className="border-green-500/50 text-green-700">
                      Aktif
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-slate-300 text-slate-500">
                      Pasif
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(k.createdAt, "dd.MM.yyyy", { locale: tr })}
                </TableCell>
                <TableCell className="flex items-center justify-end gap-1">
                  <KullaniciFormDialog
                    mode="edit"
                    kullanici={{
                      id: k.id,
                      email: k.email,
                      name: k.name,
                      role: k.role,
                      isActive: k.isActive,
                    }}
                  />
                  <form action={kullaniciAktiflikAction}>
                    <input type="hidden" name="id" value={k.id} />
                    <input type="hidden" name="isActive" value={String(!k.isActive)} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                    >
                      {k.isActive ? "Pasifleştir" : "Aktifleştir"}
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
