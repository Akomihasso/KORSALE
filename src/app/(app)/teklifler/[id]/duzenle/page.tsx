import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { indirimOnayYuzdesi } from "@/lib/belge";
import { guncelKurlar } from "@/lib/doviz-kuru";
import { TeklifForm } from "@/components/teklif-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserRole } from "@prisma/client";

type Params = Promise<{ id: string }>;

export const metadata = { title: "Teklifi Düzenle" };

export default async function TeklifDuzenlePage({ params }: { params: Params }) {
  const user = await requireAuth();
  const { id } = await params;

  const [teklif, firmalar, onayEsigi, kurlar] = await Promise.all([
    prisma.teklif.findUnique({ where: { id } }),
    prisma.firma.findMany({
      orderBy: { ad: "asc" },
      select: { id: true, ad: true, sektor: true, sehir: true },
    }),
    indirimOnayYuzdesi(),
    guncelKurlar(),
  ]);
  if (!teklif) notFound();

  // Karara bağlanmış teklifler düzenlenemez
  if (
    teklif.durum === "KABUL" ||
    teklif.durum === "REDDEDILDI" ||
    teklif.durum === "IPTAL"
  ) {
    redirect(`/teklifler/${id}`);
  }

  // Sadece sorumlu veya yönetici düzenleyebilir
  if (user.role !== UserRole.YONETICI && teklif.sorumluId !== user.id) {
    redirect(`/teklifler/${id}`);
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/teklifler/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Teklif detayı
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Teklifi Düzenle — {teklif.belgeNo}</CardTitle>
          <CardDescription>
            İndirim oranını değiştirirseniz indirim onayı sıfırlanır. Karara bağlanmış
            tekliflerde düzenleme kapalıdır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeklifForm
            firmalar={firmalar}
            teklif={teklif}
            indirimOnayEsigi={onayEsigi}
            kurlar={kurlar}
          />
        </CardContent>
      </Card>
    </div>
  );
}
