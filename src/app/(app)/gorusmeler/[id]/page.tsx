import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Building2,
  CalendarClock,
  CircleCheck,
  CircleDot,
  FileText,
  MapPin,
  Pencil,
  User,
} from "lucide-react";

import { requireAuth, ROL_ETIKETLERI } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  GORUSME_DURUM_ETIKET,
  GORUSME_SONUC_ETIKET,
  GORUSME_TIPI_ETIKET,
  bashHarfler,
  gorusmeDurumRengi,
  gorusmeSonucRengi,
  trTarihSaat,
  trTutar,
} from "@/lib/format";
import {
  gorusmeDurumDegistirAction,
  gorusmeSilAction,
} from "@/lib/actions/gorusme-actions";
import { DevirDialog } from "@/components/devir-dialog";
import { SilButon } from "@/components/sil-buton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserRole } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const g = await prisma.gorusme.findUnique({
    where: { id },
    select: { konu: true },
  });
  return { title: g?.konu ?? "Görüşme" };
}

export default async function GorusmeDetayPage({ params }: { params: Params }) {
  const user = await requireAuth();
  const { id } = await params;

  const gorusme = await prisma.gorusme.findUnique({
    where: { id },
    include: {
      firma: {
        include: {
          kisiler: {
            where: { birincil: true },
            take: 1,
          },
          _count: { select: { gorusmeler: true, teklifler: true } },
        },
      },
      sorumlu: { select: { id: true, name: true, email: true } },
      ilkTemas: { select: { id: true, name: true } },
      teklifler: {
        select: { id: true, belgeNo: true, baslik: true, durum: true },
      },
    },
  });
  if (!gorusme) notFound();

  const birincilKisi = gorusme.firma.kisiler[0];
  const yeniDurum: "ACIK" | "KAPALI" =
    gorusme.durum === "ACIK" ? "KAPALI" : "ACIK";

  const sahip = gorusme.sorumluId === user.id;
  const yonetici = user.role === UserRole.YONETICI;
  const devredebilir =
    user.role !== UserRole.GOZLEMCI && (sahip || yonetici);

  const kullanicilar = devredebilir
    ? await prisma.user.findMany({
        where: { isActive: true, role: { not: UserRole.GOZLEMCI } },
        orderBy: { name: "asc" },
        select: { id: true, name: true, role: true },
      })
    : [];
  const kullaniciOps = kullanicilar.map((k) => ({
    id: k.id,
    name: k.name,
    rolEtiketi: ROL_ETIKETLERI[k.role],
  }));

  return (
    <div className="space-y-6">
      <Link
        href="/gorusmeler"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Görüşmeler
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ANA KART (sol 2 kolon) */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={gorusmeSonucRengi(gorusme.sonuc)}>
                    {GORUSME_SONUC_ETIKET[gorusme.sonuc]}
                  </Badge>
                  <Badge variant={gorusmeDurumRengi(gorusme.durum)}>
                    {GORUSME_DURUM_ETIKET[gorusme.durum]}
                  </Badge>
                  <Badge variant="outline">
                    {GORUSME_TIPI_ETIKET[gorusme.tip]}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{gorusme.konu}</CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1">
                    <CalendarClock className="size-3.5" />
                    {trTarihSaat(gorusme.tarih)}
                  </span>
                  {gorusme.yer && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      {gorusme.yer}
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href={`/gorusmeler/${gorusme.id}/duzenle`} />}
                >
                  <Pencil className="size-4" /> Düzenle
                </Button>
                {user.role === UserRole.YONETICI && (
                  <SilButon
                    id={gorusme.id}
                    action={gorusmeSilAction}
                    onayMetni="Bu görüşmeyi silmek istediğinizden emin misiniz? Bağlı teklif varsa silinmez."
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Özet
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm">{gorusme.ozet}</p>
              </div>

              <Separator />

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                {gorusme.tahminiTutar && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Tahmini iş tutarı
                    </p>
                    <p className="text-base font-medium">
                      {trTutar(gorusme.tahminiTutar)}
                    </p>
                  </div>
                )}
                {gorusme.hatirlatma && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      <Bell className="mr-1 inline size-3" />
                      Hatırlatma
                    </p>
                    <p>{trTarihSaat(gorusme.hatirlatma)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AKSİYONLAR */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aksiyonlar</CardTitle>
              <CardDescription>
                Görüşmenin akıbeti — durumu kapat veya teklif oluştur
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <form action={gorusmeDurumDegistirAction}>
                <input type="hidden" name="id" value={gorusme.id} />
                <input type="hidden" name="durum" value={yeniDurum} />
                <Button type="submit" variant="outline" size="sm">
                  {gorusme.durum === "ACIK" ? (
                    <>
                      <CircleCheck className="size-4" /> Kapalı olarak işaretle
                    </>
                  ) : (
                    <>
                      <CircleDot className="size-4" /> Yeniden aç
                    </>
                  )}
                </Button>
              </form>

              {gorusme.sonuc === "TEKLIF_ISTENDI" &&
                gorusme.teklifler.length === 0 && (
                  <Button
                    size="sm"
                    render={
                      <Link
                        href={`/teklifler/yeni?gorusmeId=${gorusme.id}&firmaId=${gorusme.firma.id}`}
                      />
                    }
                  >
                    <FileText className="size-4" /> Teklif Oluştur
                  </Button>
                )}

              {gorusme.teklifler.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="size-4" />
                  Bağlı teklif{gorusme.teklifler.length > 1 ? "ler" : ""}:
                  {gorusme.teklifler.map((t) => (
                    <Link
                      key={t.id}
                      href={`/teklifler/${t.id}`}
                      className="rounded-md bg-muted px-2 py-0.5 text-xs hover:bg-muted/70"
                    >
                      {t.belgeNo}
                    </Link>
                  ))}
                </div>
              )}

              {devredebilir && (
                <DevirDialog
                  hedefTipi="GORUSME"
                  hedefId={gorusme.id}
                  hedefBaslik={gorusme.konu}
                  mevcutSorumluId={gorusme.sorumlu.id}
                  kullanicilar={kullaniciOps}
                  zorlaDevir={yonetici && !sahip}
                  triggerLabel={yonetici && !sahip ? "Zorla devret" : "Devret"}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* SAĞ — FİRMA + KİŞİLER */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="size-4" />
                Firma
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <Link
                  href={`/firmalar/${gorusme.firma.id}`}
                  className="block font-medium hover:underline"
                >
                  {gorusme.firma.ad}
                </Link>
                {gorusme.firma.sektor && (
                  <p className="text-xs text-muted-foreground">
                    {gorusme.firma.sektor}
                    {gorusme.firma.sehir && ` · ${gorusme.firma.sehir}`}
                  </p>
                )}
              </div>

              {birincilKisi && (
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Birincil kişi</p>
                  <p className="font-medium">{birincilKisi.ad}</p>
                  {birincilKisi.unvan && (
                    <p className="text-xs text-muted-foreground">
                      {birincilKisi.unvan}
                    </p>
                  )}
                  {birincilKisi.telefon && (
                    <p className="mt-1 text-xs">{birincilKisi.telefon}</p>
                  )}
                  {birincilKisi.email && (
                    <p className="text-xs text-muted-foreground">
                      {birincilKisi.email}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{gorusme.firma._count.gorusmeler} görüşme</span>
                <span>{gorusme.firma._count.teklifler} teklif</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="size-4" />
                Sorumluluk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Avatar className="size-9">
                  <AvatarFallback>
                    {bashHarfler(gorusme.sorumlu.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium">{gorusme.sorumlu.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Şu an sorumlu
                  </p>
                </div>
              </div>

              {gorusme.ilkTemas.id !== gorusme.sorumlu.id && (
                <div className="flex items-center gap-3 border-t pt-3">
                  <Avatar className="size-9">
                    <AvatarFallback>
                      {bashHarfler(gorusme.ilkTemas.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium">{gorusme.ilkTemas.name}</p>
                    <p className="text-xs text-muted-foreground">İlk temas</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
