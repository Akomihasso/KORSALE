import Link from "next/link";

import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { KORSISTEM_KATEGORI_LISTE } from "@/lib/korsistem";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "KORSİSTEM" };

export default async function KorsistemPage() {
  await requireAuth();

  const sayilar = await prisma.dokuman.groupBy({
    by: ["kategori"],
    _count: true,
    where: { aktif: true },
  });

  const kategoriSayisi = (k: string) =>
    sayilar.find((s) => s.kategori === k)?._count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">KORSİSTEM</h1>
        <p className="text-sm text-muted-foreground">
          Kordinat&apos;ın iç işleyiş kuralları, prosedürleri ve şablonları — tek noktada
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {KORSISTEM_KATEGORI_LISTE.map((kat) => {
          const Icon = kat.icon;
          const sayi = kategoriSayisi(kat.enum);
          return (
            <Link
              key={kat.enum}
              href={`/korsistem/${kat.slug}`}
              className="block"
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {sayi} doküman
                    </span>
                  </div>
                  <CardTitle className="text-base">{kat.baslik}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-xs leading-relaxed">
                    {kat.aciklama}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
