import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { indirimOnayYuzdesi } from "@/lib/belge";
import { TeklifForm } from "@/components/teklif-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Yeni Teklif" };

type SearchParams = Promise<{ firmaId?: string; gorusmeId?: string }>;

export default async function YeniTeklifPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAuth();
  const { firmaId, gorusmeId } = await searchParams;

  let varsayilanFirmaId = firmaId;
  let baglamMetni: string | null = null;

  if (gorusmeId) {
    const g = await prisma.gorusme.findUnique({
      where: { id: gorusmeId },
      select: {
        firmaId: true,
        konu: true,
        firma: { select: { ad: true } },
      },
    });
    if (g) {
      varsayilanFirmaId = g.firmaId;
      baglamMetni = `Görüşmeden devam ediliyor: ${g.firma.ad} — ${g.konu}`;
    }
  }

  const [firmaKayitlari, onayEsigi] = await Promise.all([
    prisma.firma.findMany({
      orderBy: { ad: "asc" },
      select: {
        id: true,
        ad: true,
        sektor: true,
        sehir: true,
        _count: { select: { gorusmeler: true } },
        gorusmeler: {
          orderBy: { tarih: "desc" },
          take: 1,
          select: { tarih: true },
        },
      },
    }),
    indirimOnayYuzdesi(),
  ]);

  // Teklif/Talimat/Sözleşme oluştururken görüşmesi olan firmaları öne çıkar:
  // FirmaSecici, gorusmeSayisi > 0 olanları üstte renkli rozetle gösterir.
  const firmalar = firmaKayitlari.map((f) => ({
    id: f.id,
    ad: f.ad,
    sektor: f.sektor,
    sehir: f.sehir,
    gorusmeSayisi: f._count.gorusmeler,
    sonGorusmeTarih: f.gorusmeler[0]?.tarih ?? null,
  }));

  return (
    <div className="space-y-6">
      <Link
        href="/teklifler"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Teklifler
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Yeni Teklif</CardTitle>
          <CardDescription>
            {baglamMetni
              ? baglamMetni
              : "Sorumlu ve hazırlayan otomatik olarak siz işaretlenir. Belge no kayıttan sonra üretilir."}
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
            <TeklifForm
              firmalar={firmalar}
              varsayilanFirmaId={varsayilanFirmaId}
              varsayilanGorusmeId={gorusmeId}
              indirimOnayEsigi={onayEsigi}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
