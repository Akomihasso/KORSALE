import Link from "next/link";
import { Settings, Users } from "lucide-react";

import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Ayarlar" };

const AYAR_KARTLARI = [
  {
    href: "/ayarlar/kullanicilar",
    icon: Users,
    title: "Kullanıcılar",
    description: "Kullanıcı ekle, düzenle, rolünü ve aktiflik durumunu yönet",
  },
  {
    href: "/ayarlar/sistem",
    icon: Settings,
    title: "Sistem Parametreleri",
    description:
      "İndirim onay eşiği, belge no formatı, devir otomatik kabul süresi (yakında)",
  },
];

export default async function AyarlarPage() {
  await requireRole(UserRole.YONETICI);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ayarlar</h1>
        <p className="text-sm text-muted-foreground">
          Sistem yapılandırması ve kullanıcı yönetimi
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {AYAR_KARTLARI.map((karti) => {
          const Icon = karti.icon;
          return (
            <Link
              key={karti.href}
              href={karti.href}
              className="block transition-colors hover:bg-muted/50 rounded-xl"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{karti.title}</CardTitle>
                      <CardDescription>{karti.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
