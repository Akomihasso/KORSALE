import { KeyRound, Mail, ShieldCheck, User } from "lucide-react";

import { requireAuth, ROL_ETIKETLERI } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfilAdForm } from "@/components/profil-ad-form";
import { SifreDegistirForm } from "@/components/sifre-degistir-form";

export const metadata = { title: "Profilim" };

function bashHarfler(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function ProfilPage() {
  const sessionUser = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profilim</h1>
        <p className="text-sm text-muted-foreground">
          Hesap bilgilerinizi görüntüleyin ve şifrenizi değiştirin
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* SOL — Özet kart */}
        <Card className="lg:col-span-1">
          <CardHeader className="items-center pb-3 text-center">
            <Avatar className="size-20">
              <AvatarFallback className="text-xl">
                {bashHarfler(user.name)}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="mt-3 text-lg">{user.name}</CardTitle>
            <CardDescription>{ROL_ETIKETLERI[user.role]}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2">
              <Mail className="size-3.5 text-muted-foreground" />
              <span className="truncate text-xs">{user.email}</span>
            </div>
            <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2">
              <ShieldCheck className="size-3.5 text-muted-foreground" />
              <span className="text-xs">{ROL_ETIKETLERI[user.role]}</span>
            </div>
          </CardContent>
        </Card>

        {/* SAĞ — Ad + Şifre formları */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="size-4" /> Hesap bilgileri
              </CardTitle>
              <CardDescription>
                Görünen adınızı değiştirebilirsiniz. E-posta değişikliği için yöneticinize başvurun.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfilAdForm name={user.name} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound className="size-4" /> Şifre değiştir
              </CardTitle>
              <CardDescription>
                Şifrenizi düzenli olarak değiştirin. Yeni şifreniz en az 8 karakter olmalı.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SifreDegistirForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
