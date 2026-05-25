import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { GorusmeForm } from "@/components/gorusme-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Params = Promise<{ id: string }>;

export const metadata = { title: "Görüşmeyi Düzenle" };

export default async function GorusmeDuzenlePage({
  params,
}: {
  params: Params;
}) {
  await requireAuth();
  const { id } = await params;

  const [gorusme, firmalar] = await Promise.all([
    prisma.gorusme.findUnique({ where: { id } }),
    prisma.firma.findMany({
      orderBy: { ad: "asc" },
      select: { id: true, ad: true, sektor: true, sehir: true },
    }),
  ]);
  if (!gorusme) notFound();

  return (
    <div className="space-y-6">
      <Link
        href={`/gorusmeler/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Görüşme detayı
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Görüşmeyi Düzenle</CardTitle>
          <CardDescription>
            Firma bağlantısı değiştirilemez. Sorumluyu değiştirmek için Devir aksiyonunu
            kullanın (Sprint 3).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GorusmeForm firmalar={firmalar} gorusme={gorusme} />
        </CardContent>
      </Card>
    </div>
  );
}
