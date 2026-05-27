import Link from "next/link";
import { Check, Inbox, X } from "lucide-react";
import type { DevirDurum, Prisma } from "@prisma/client";

import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  DEVIR_DURUM_ETIKET,
  bashHarfler,
  devirDurumRengi,
  trGoreceli,
  trTarihSaat,
} from "@/lib/format";
import {
  devirKabulAction,
  devirRedAction,
} from "@/lib/actions/devir-actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "İş Devri" };

type Grup = "BEKLEYEN" | "KABUL" | "REDDEDILEN" | "TUMU";

type SearchParams = Promise<{ grup?: Grup }>;

const GRUP_FILTRE: Record<Grup, DevirDurum[] | undefined> = {
  TUMU: undefined,
  BEKLEYEN: ["BEKLIYOR"],
  KABUL: ["KABUL", "ZORLA_DEVIR"],
  REDDEDILEN: ["REDDEDILDI", "GERI_ALINDI"],
};

function devirHedefLink(devir: {
  hedefTipi: "GORUSME" | "TEKLIF" | "OPERASYON";
  gorusmeId: string | null;
  teklifId: string | null;
  operasyonId: string | null;
}): string | null {
  switch (devir.hedefTipi) {
    case "GORUSME":
      return devir.gorusmeId ? `/gorusmeler/${devir.gorusmeId}` : null;
    case "TEKLIF":
      return devir.teklifId ? `/teklifler/${devir.teklifId}` : null;
    case "OPERASYON":
      return devir.operasyonId ? `/operasyonlar/${devir.operasyonId}` : null;
  }
}

function hedefBaslik(devir: {
  hedefTipi: "GORUSME" | "TEKLIF" | "OPERASYON";
  gorusme: { konu: string } | null;
  teklif: { belgeNo: string; baslik: string } | null;
  operasyon: { teklif: { belgeNo: string; baslik: string } } | null;
}): string {
  if (devir.hedefTipi === "GORUSME") return devir.gorusme?.konu ?? "Görüşme";
  if (devir.hedefTipi === "TEKLIF") {
    return devir.teklif ? `${devir.teklif.belgeNo} — ${devir.teklif.baslik}` : "Teklif";
  }
  if (devir.hedefTipi === "OPERASYON") {
    return devir.operasyon
      ? `${devir.operasyon.teklif.belgeNo} — ${devir.operasyon.teklif.baslik}`
      : "Operasyon";
  }
  return "—";
}

export default async function BanaGelenDevirlerPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireAuth();
  const { grup } = await searchParams;
  const aktif: Grup = grup ?? "BEKLEYEN";
  const filtre = GRUP_FILTRE[aktif];

  const where: Prisma.GorevDevirWhereInput = {
    devralanId: user.id,
    ...(filtre ? { durum: { in: filtre } } : {}),
  };

  const [devirler, sayilar] = await Promise.all([
    prisma.gorevDevir.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        devreden: { select: { id: true, name: true } },
        gorusme: { select: { konu: true } },
        teklif: { select: { belgeNo: true, baslik: true } },
        operasyon: {
          select: { teklif: { select: { belgeNo: true, baslik: true } } },
        },
      },
    }),
    prisma.gorevDevir.groupBy({
      by: ["durum"],
      where: { devralanId: user.id },
      _count: true,
    }),
  ]);

  const say = (durums: DevirDurum[]) =>
    sayilar
      .filter((s) => durums.includes(s.durum))
      .reduce((acc, s) => acc + (s._count as unknown as number), 0);

  const bekleyenSayisi = say(["BEKLIYOR"]);
  const kabulSayisi = say(["KABUL", "ZORLA_DEVIR"]);
  const redSayisi = say(["REDDEDILDI", "GERI_ALINDI"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">İş Devri</h1>
        <p className="text-sm text-muted-foreground">
          Sana devredilen görüşme, teklif ve operasyonlar — bekleyenler için karar ver
        </p>
      </div>

      <Tabs value={aktif}>
        <TabsList>
          <TabsTrigger
            value="BEKLEYEN"
            render={<Link href="/is-devri?grup=BEKLEYEN" />}
          >
            Bekleyen ({bekleyenSayisi})
          </TabsTrigger>
          <TabsTrigger value="KABUL" render={<Link href="/is-devri?grup=KABUL" />}>
            Kabul ({kabulSayisi})
          </TabsTrigger>
          <TabsTrigger
            value="REDDEDILEN"
            render={<Link href="/is-devri?grup=REDDEDILEN" />}
          >
            Reddedilen ({redSayisi})
          </TabsTrigger>
          <TabsTrigger value="TUMU" render={<Link href="/is-devri?grup=TUMU" />}>
            Tümü
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {devirler.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
            <Inbox className="size-10 opacity-30" />
            <p className="text-sm">
              {aktif === "BEKLEYEN"
                ? "Bekleyen devir yok — her şey güncel"
                : "Bu sekmede kayıt yok"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {devirler.map((d) => {
            const link = devirHedefLink(d);
            const baslik = hedefBaslik(d);
            const bekliyor = d.durum === "BEKLIYOR";

            return (
              <Card key={d.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={devirDurumRengi(d.durum)}>
                        {DEVIR_DURUM_ETIKET[d.durum]}
                      </Badge>
                      <Badge variant="outline">
                        {d.hedefTipi === "GORUSME"
                          ? "Görüşme"
                          : d.hedefTipi === "TEKLIF"
                            ? "Teklif"
                            : "Operasyon"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {trGoreceli(d.createdAt)}
                      </span>
                    </div>
                    <CardTitle className="text-base">
                      {link ? (
                        <Link href={link} className="hover:underline">
                          {baslik}
                        </Link>
                      ) : (
                        baslik
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Avatar className="size-5">
                        <AvatarFallback className="text-[10px]">
                          {bashHarfler(d.devreden.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{d.devreden.name} devretti</span>
                      <span className="text-[11px] text-muted-foreground">
                        · {trTarihSaat(d.createdAt)}
                      </span>
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Devir notu
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{d.devirNotu}</p>
                  </div>

                  {d.redNedeni && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-destructive">
                        Red nedenin
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">{d.redNedeni}</p>
                    </div>
                  )}

                  {bekliyor && (
                    <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                      <form action={devirKabulAction}>
                        <input type="hidden" name="id" value={d.id} />
                        <Button type="submit" size="sm">
                          <Check className="size-4" /> Kabul et
                        </Button>
                      </form>

                      <details className="group">
                        <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-muted">
                          <X className="size-4" /> Reddet
                        </summary>
                        <form
                          action={devirRedAction}
                          className="mt-2 w-72 space-y-2 rounded-md border bg-card p-3 shadow-sm"
                        >
                          <input type="hidden" name="id" value={d.id} />
                          <Textarea
                            name="redNedeni"
                            rows={3}
                            required
                            minLength={5}
                            placeholder="Neden devralamadığını yaz (en az 5 karakter)"
                          />
                          <Button type="submit" size="sm" variant="destructive">
                            Reddi kaydet
                          </Button>
                        </form>
                      </details>
                    </div>
                  )}

                  {d.cevapTar && !bekliyor && (
                    <p className="text-xs text-muted-foreground">
                      Karar: {trTarihSaat(d.cevapTar)}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
