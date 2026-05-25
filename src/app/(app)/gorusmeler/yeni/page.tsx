import Link from "next/link";
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

export const metadata = { title: "Yeni Görüşme" };

type SearchParams = Promise<{ firmaId?: string }>;

export default async function YeniGorusmePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAuth();
  const { firmaId } = await searchParams;

  const firmalar = await prisma.firma.findMany({
    orderBy: { ad: "asc" },
    select: { id: true, ad: true, sektor: true, sehir: true },
  });

  return (
    <div className="space-y-6">
      <Link
        href="/gorusmeler"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Görüşmeler
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Yeni Görüşme</CardTitle>
          <CardDescription>
            Görüşme kaydedildiğinde sorumlu ve ilk temas otomatik sen olarak işaretlenir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {firmalar.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Önce bir firma eklemelisin —{" "}
              <Link href="/firmalar" className="text-primary underline">
                Firmalar sayfasına git
              </Link>
              .
            </p>
          ) : (
            <GorusmeForm firmalar={firmalar} varsayilanFirmaId={firmaId} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
