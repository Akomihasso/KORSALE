import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  Building2,
  CalendarClock,
  Check,
  CircleCheck,
  CircleX,
  ClipboardList,
  Clock,
  Pencil,
  Send,
  ShieldCheck,
  User,
  Wallet,
  X,
} from "lucide-react";

import { requireAuth, ROL_ETIKETLERI } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  BELGE_TIPI_ETIKET,
  TEKLIF_ASAMA_ETIKET,
  TEKLIF_DURUM_GORUNUM,
  TEKLIF_RED_KATEGORI_ETIKET,
  bashHarfler,
  belgeTipiRengi,
  kabulOlasilikRengi,
  teklifAsamaRengi,
  teklifAsamasi,
  trTarih,
  trTarihSaat,
  trTutar,
  trYuzde,
} from "@/lib/format";
import {
  teklifGonderAction,
  teklifIndirimOnayAction,
  teklifKabulAction,
  teklifOdemeAlindiAction,
  teklifRedAction,
  teklifIptalAction,
  teklifSilAction,
} from "@/lib/actions/teklif-actions";
import { DevirDialog } from "@/components/devir-dialog";
import { SilButon } from "@/components/sil-buton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { UserRole } from "@prisma/client";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const t = await prisma.teklif.findUnique({
    where: { id },
    select: { belgeNo: true, baslik: true },
  });
  return { title: t ? `${t.belgeNo} — ${t.baslik}` : "Teklif" };
}

export default async function TeklifDetayPage({ params }: { params: Params }) {
  const user = await requireAuth();
  const { id } = await params;

  const teklif = await prisma.teklif.findUnique({
    where: { id },
    include: {
      firma: {
        include: {
          kisiler: { where: { birincil: true }, take: 1 },
          _count: { select: { gorusmeler: true, teklifler: true } },
        },
      },
      sorumlu: { select: { id: true, name: true, email: true } },
      kapatan: { select: { id: true, name: true } },
      gorusme: { select: { id: true, konu: true } },
      operasyon: { select: { id: true, durum: true } },
    },
  });
  if (!teklif) notFound();

  const indirimOnayan = teklif.indirimOnayId
    ? await prisma.user.findUnique({
        where: { id: teklif.indirimOnayId },
        select: { name: true },
      })
    : null;

  const sahip = user.role === UserRole.YONETICI || teklif.sorumluId === user.id;
  const yonetici = user.role === UserRole.YONETICI;
  const gozlemci = user.role === UserRole.GOZLEMCI;

  const asama = teklifAsamasi({
    durum: teklif.durum,
    odemeAlindiTar: teklif.odemeAlindiTar,
    operasyonDurum: teklif.operasyon?.durum ?? null,
  });
  const gorunum = TEKLIF_DURUM_GORUNUM[asama];

  const odemeAlan = teklif.odemeAlanId
    ? await prisma.user.findUnique({
        where: { id: teklif.odemeAlanId },
        select: { name: true },
      })
    : null;

  const duzenlenebilir =
    sahip &&
    !gozlemci &&
    teklif.durum !== "KABUL" &&
    teklif.durum !== "REDDEDILDI" &&
    teklif.durum !== "IPTAL";

  const gonderebilir = sahip && !gozlemci && teklif.durum === "TASLAK";
  const onayBekliyor = teklif.durum === "ONAY_BEKLIYOR";
  const karaVerebilir =
    sahip &&
    !gozlemci &&
    (teklif.durum === "GONDERILDI" || teklif.durum === "BEKLEMEDE");
  const odemeBekliyor =
    sahip && !gozlemci && teklif.durum === "KABUL" && !teklif.odemeAlindiTar;
  const iptalEdilebilir =
    sahip &&
    !gozlemci &&
    teklif.durum !== "KABUL" &&
    teklif.durum !== "REDDEDILDI" &&
    teklif.durum !== "IPTAL";

  const devredebilir = !gozlemci && (sahip || yonetici);
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

  const birincilKisi = teklif.firma.kisiler[0];

  return (
    <div className="space-y-6">
      <Link
        href="/teklifler"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Teklifler
      </Link>

      {onayBekliyor && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-50 px-4 py-3 text-sm dark:bg-amber-950/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 size-4 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-medium">İndirim onayı bekliyor</p>
                <p className="text-xs text-muted-foreground">
                  %{teklif.indirimYuzde?.toString()} indirim talep edildi — yönetici
                  onayından sonra gönderilebilir.
                </p>
              </div>
            </div>
            {yonetici && (
              <form action={teklifIndirimOnayAction}>
                <input type="hidden" name="id" value={teklif.id} />
                <Button type="submit" size="sm">
                  <Check className="size-4" /> İndirimi onayla
                </Button>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={belgeTipiRengi(teklif.belgeTipi)}>
                    {BELGE_TIPI_ETIKET[teklif.belgeTipi]}
                  </Badge>
                  <Badge variant={teklifAsamaRengi(asama)} className={gorunum.sinif}>
                    {TEKLIF_ASAMA_ETIKET[asama]}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    {teklif.belgeNo}
                  </span>
                </div>
                <CardTitle className="text-xl">{teklif.baslik}</CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1">
                    <CalendarClock className="size-3.5" />
                    {trTarihSaat(teklif.createdAt)}
                  </span>
                  {teklif.gecerlilikTarih && (
                    <span className="flex items-center gap-1">
                      Geçerlilik: {trTarih(teklif.gecerlilikTarih)}
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {duzenlenebilir && (
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={`/teklifler/${teklif.id}/duzenle`} />}
                  >
                    <Pencil className="size-4" /> Düzenle
                  </Button>
                )}
                {yonetici && (
                  <SilButon
                    id={teklif.id}
                    action={teklifSilAction}
                    onayMetni="Bu belgeyi silmek istediğinizden emin misiniz? Bağlı operasyon varsa silinmez."
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  İçerik
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm">{teklif.icerik}</p>
              </div>

              <Separator />

              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Tutar</p>
                  <p className="text-base font-medium">
                    {trTutar(teklif.tutar, teklif.paraBirimi)}
                  </p>
                </div>
                {teklif.indirimYuzde && (
                  <div>
                    <p className="text-xs text-muted-foreground">İndirim</p>
                    <p className="text-base font-medium">
                      {trYuzde(teklif.indirimYuzde)}
                    </p>
                    {indirimOnayan && (
                      <p className="text-[10px] text-muted-foreground">
                        Onay: {indirimOnayan.name}
                        {teklif.indirimOnayTar
                          ? ` · ${trTarihSaat(teklif.indirimOnayTar)}`
                          : ""}
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Net Tutar</p>
                  <p className="text-base font-semibold">
                    {trTutar(teklif.netTutar, teklif.paraBirimi)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Kabul olasılığı</p>
                  <p
                    className={`text-base font-medium ${kabulOlasilikRengi(teklif.kabulOlasilik)}`}
                  >
                    %{teklif.kabulOlasilik}
                  </p>
                </div>
                {teklif.gonderilmeTar && (
                  <div>
                    <p className="text-xs text-muted-foreground">Gönderildi</p>
                    <p>{trTarihSaat(teklif.gonderilmeTar)}</p>
                  </div>
                )}
                {teklif.kabulTar && (
                  <div>
                    <p className="text-xs text-muted-foreground">Karar tarihi</p>
                    <p>{trTarihSaat(teklif.kabulTar)}</p>
                  </div>
                )}
                {teklif.odemeAlindiTar && (
                  <div>
                    <p className="text-xs text-muted-foreground">Para alındı</p>
                    <p>{trTarihSaat(teklif.odemeAlindiTar)}</p>
                    {odemeAlan && (
                      <p className="text-[10px] text-muted-foreground">
                        İşaretleyen: {odemeAlan.name}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {teklif.durum === "REDDEDILDI" && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-destructive">
                      Red nedeni
                    </p>
                    {teklif.redKategorisi && (
                      <Badge variant="destructive" className="mt-1">
                        {TEKLIF_RED_KATEGORI_ETIKET[teklif.redKategorisi]}
                      </Badge>
                    )}
                    {teklif.redNedeni && (
                      <p className="mt-2 whitespace-pre-wrap text-sm">
                        {teklif.redNedeni}
                      </p>
                    )}
                  </div>
                </>
              )}

            </CardContent>
          </Card>

          {/* AKSİYONLAR */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aksiyonlar</CardTitle>
              <CardDescription>
                Belgenin durumunu ilerlet — gönder, karara bağla, ödemeyi işaretle veya devret
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {gonderebilir && (
                <form action={teklifGonderAction}>
                  <input type="hidden" name="id" value={teklif.id} />
                  <Button type="submit" size="sm">
                    <Send className="size-4" /> Gönder
                  </Button>
                </form>
              )}

              {karaVerebilir && (
                <>
                  <span className="inline-flex items-center gap-1 rounded-md border border-sky-500/30 bg-sky-50 px-3 py-1.5 text-xs text-sky-700 dark:bg-sky-950/20 dark:text-sky-300">
                    <Clock className="size-3.5" /> Müşteri cevabı bekleniyor
                  </span>
                  <form action={teklifKabulAction}>
                    <input type="hidden" name="id" value={teklif.id} />
                    <Button type="submit" size="sm" variant="default">
                      <CircleCheck className="size-4" /> Onaylandı
                    </Button>
                  </form>

                  <details className="group">
                    <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm hover:bg-muted">
                      <CircleX className="size-4" /> Reddedildi
                    </summary>
                    <form
                      action={teklifRedAction}
                      className="mt-2 w-80 space-y-2 rounded-md border bg-card p-3 shadow-sm"
                    >
                      <input type="hidden" name="id" value={teklif.id} />
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          Red kategorisi
                        </label>
                        <select
                          name="redKategorisi"
                          required
                          defaultValue=""
                          className="block w-full rounded-md border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="" disabled>
                            Seçiniz…
                          </option>
                          {(
                            Object.entries(TEKLIF_RED_KATEGORI_ETIKET) as [
                              keyof typeof TEKLIF_RED_KATEGORI_ETIKET,
                              string,
                            ][]
                          ).map(([deger, etiket]) => (
                            <option key={deger} value={deger}>
                              {etiket}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Textarea
                        name="redNedeni"
                        rows={3}
                        placeholder="Açıklama (opsiyonel — 'Diğer' seçildiyse zorunlu)"
                        minLength={0}
                      />
                      <Button type="submit" size="sm" variant="destructive">
                        <X className="size-4" /> Reddi kaydet
                      </Button>
                    </form>
                  </details>
                </>
              )}

              {odemeBekliyor && (
                <form action={teklifOdemeAlindiAction}>
                  <input type="hidden" name="id" value={teklif.id} />
                  <Button type="submit" size="sm" variant="default">
                    <Wallet className="size-4" /> Para alındı
                  </Button>
                </form>
              )}

              {iptalEdilebilir && teklif.durum !== "TASLAK" && (
                <form action={teklifIptalAction}>
                  <input type="hidden" name="id" value={teklif.id} />
                  <Button type="submit" size="sm" variant="outline">
                    <Ban className="size-4" /> İptal
                  </Button>
                </form>
              )}

              {devredebilir && (
                <DevirDialog
                  hedefTipi="TEKLIF"
                  hedefId={teklif.id}
                  hedefBaslik={`${teklif.belgeNo} — ${teklif.baslik}`}
                  mevcutSorumluId={teklif.sorumlu.id}
                  kullanicilar={kullaniciOps}
                  zorlaDevir={yonetici && !sahip}
                  triggerLabel={yonetici && !sahip ? "Zorla devret" : "Devret"}
                />
              )}

              {teklif.operasyon && (
                <Link
                  href={`/operasyonlar/${teklif.operasyon.id}`}
                  className="ml-auto inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Operasyona git
                </Link>
              )}
            </CardContent>
          </Card>

          {teklif.gorusme && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Kaynak görüşme</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/gorusmeler/${teklif.gorusme.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {teklif.gorusme.konu}
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* SAĞ KOLON */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="size-4" /> Firma
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <Link
                  href={`/firmalar/${teklif.firma.id}`}
                  className="block font-medium hover:underline"
                >
                  {teklif.firma.ad}
                </Link>
                {teklif.firma.sektor && (
                  <p className="text-xs text-muted-foreground">
                    {teklif.firma.sektor}
                    {teklif.firma.sehir && ` · ${teklif.firma.sehir}`}
                  </p>
                )}
              </div>

              {birincilKisi && (
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Birincil kişi</p>
                  <p className="font-medium">{birincilKisi.ad}</p>
                  {birincilKisi.unvan && (
                    <p className="text-xs text-muted-foreground">{birincilKisi.unvan}</p>
                  )}
                  {birincilKisi.telefon && (
                    <p className="mt-1 text-xs">{birincilKisi.telefon}</p>
                  )}
                  {birincilKisi.email && (
                    <p className="text-xs text-muted-foreground">{birincilKisi.email}</p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{teklif.firma._count.gorusmeler} görüşme</span>
                <span>{teklif.firma._count.teklifler} teklif</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="size-4" /> Sorumluluk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Avatar className="size-9">
                  <AvatarFallback>{bashHarfler(teklif.sorumlu.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium">{teklif.sorumlu.name}</p>
                  <p className="text-xs text-muted-foreground">Şu an sorumlu</p>
                </div>
              </div>

              {teklif.kapatan && teklif.kapatan.id !== teklif.sorumlu.id && (
                <div className="flex items-center gap-3 border-t pt-3">
                  <Avatar className="size-9">
                    <AvatarFallback>{bashHarfler(teklif.kapatan.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium">{teklif.kapatan.name}</p>
                    <p className="text-xs text-muted-foreground">Kararı veren</p>
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
