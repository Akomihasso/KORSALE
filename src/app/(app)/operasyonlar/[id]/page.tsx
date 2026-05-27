import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CircleCheck,
  ClipboardList,
  Play,
  User,
} from "lucide-react";

import { requireAuth, ROL_ETIKETLERI } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  OPERASYON_DURUM_ETIKET,
  OPERASYON_KATEGORI_ETIKET,
  bashHarfler,
  operasyonDurumRengi,
  trTarih,
  trTarihSaat,
  trTutar,
} from "@/lib/format";
import {
  operasyonBaslatAction,
  operasyonBittiAction,
  operasyonKategoriDegistirAction,
  operasyonSorumluDegistirAction,
} from "@/lib/actions/operasyon-actions";
import { DevirDialog } from "@/components/devir-dialog";
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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { OperasyonKategori, UserRole } from "@prisma/client";

type Params = Promise<{ id: string }>;

const KATEGORI_LISTE: OperasyonKategori[] = [
  "MARKA",
  "PATENT",
  "TASARIM",
  "DANISMANLIK",
  "DIGER",
];

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const op = await prisma.operasyon.findUnique({
    where: { id },
    select: { teklif: { select: { belgeNo: true, baslik: true } } },
  });
  return {
    title: op ? `${op.teklif.belgeNo} — ${op.teklif.baslik}` : "Operasyon",
  };
}

export default async function OperasyonDetayPage({ params }: { params: Params }) {
  const user = await requireAuth();
  const { id } = await params;

  const operasyon = await prisma.operasyon.findUnique({
    where: { id },
    include: {
      sorumlu: { select: { id: true, name: true, email: true } },
      teklif: {
        select: {
          id: true,
          belgeNo: true,
          baslik: true,
          netTutar: true,
          paraBirimi: true,
          kabulTar: true,
          odemeAlindiTar: true,
          firma: {
            select: {
              id: true,
              ad: true,
              sektor: true,
              sehir: true,
              kisiler: { where: { birincil: true }, take: 1 },
            },
          },
        },
      },
    },
  });
  if (!operasyon) notFound();

  const yonetici = user.role === UserRole.YONETICI;
  const gozlemci = user.role === UserRole.GOZLEMCI;
  const sorumlu = operasyon.sorumluId === user.id;
  const sahip = yonetici || sorumlu;

  const baslatilabilir =
    sahip && !gozlemci && operasyon.durum === "BEKLIYOR";
  const bitirilebilir =
    sahip &&
    !gozlemci &&
    operasyon.durum !== "TAMAMLANDI" &&
    operasyon.durum !== "IPTAL";
  const sorumluyuDegistirebilir = !gozlemci && (yonetici || sorumlu);

  const kullanicilar = sorumluyuDegistirebilir
    ? await prisma.user.findMany({
        where: { isActive: true, role: { not: UserRole.GOZLEMCI } },
        orderBy: { name: "asc" },
        select: { id: true, name: true, role: true },
      })
    : [];

  const birincilKisi = operasyon.teklif.firma.kisiler[0];

  return (
    <div className="space-y-6">
      <Link
        href="/operasyonlar"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Operasyonlar
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* ÜST KART: özet */}
          <Card>
            <CardHeader>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={operasyonDurumRengi(operasyon.durum)}>
                    {OPERASYON_DURUM_ETIKET[operasyon.durum]}
                  </Badge>
                  <Badge variant="outline">
                    {OPERASYON_KATEGORI_ETIKET[operasyon.kategori]}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    {operasyon.teklif.belgeNo}
                  </span>
                </div>
                <CardTitle className="text-xl">{operasyon.teklif.baslik}</CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1">
                    <CalendarClock className="size-3.5" />
                    Açılış: {trTarihSaat(operasyon.createdAt)}
                  </span>
                  {operasyon.baslangicTar && (
                    <span>· Başlangıç: {trTarih(operasyon.baslangicTar)}</span>
                  )}
                  {operasyon.bitisTar && (
                    <span>· Bitiş: {trTarih(operasyon.bitisTar)}</span>
                  )}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Tutar</p>
                  <p className="text-base font-semibold">
                    {trTutar(operasyon.teklif.netTutar)}
                  </p>
                </div>
                {operasyon.teklif.kabulTar && (
                  <div>
                    <p className="text-xs text-muted-foreground">Kabul</p>
                    <p>{trTarihSaat(operasyon.teklif.kabulTar)}</p>
                  </div>
                )}
                {operasyon.teklif.odemeAlindiTar && (
                  <div>
                    <p className="text-xs text-muted-foreground">Para alındı</p>
                    <p>{trTarihSaat(operasyon.teklif.odemeAlindiTar)}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  İlerleme · %{operasyon.ilerlemeYuzde}
                </p>
                <Progress value={operasyon.ilerlemeYuzde} />
              </div>

              {operasyon.sonDurum && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Son durum notu
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">
                      {operasyon.sonDurum}
                    </p>
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
                Operasyonu başlat, dosya tamamlandıysa bitir veya başka bir kullanıcıya devret
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-3">
              {baslatilabilir && (
                <form action={operasyonBaslatAction}>
                  <input type="hidden" name="id" value={operasyon.id} />
                  <Button type="submit" size="sm">
                    <Play className="size-4" /> Başlat
                  </Button>
                </form>
              )}

              {bitirilebilir && (
                <form action={operasyonBittiAction}>
                  <input type="hidden" name="id" value={operasyon.id} />
                  <Button type="submit" size="sm" variant="default">
                    <CircleCheck className="size-4" /> İşi bitir
                  </Button>
                </form>
              )}

              {/* Kategori değişimi */}
              <form
                action={operasyonKategoriDegistirAction}
                className="flex items-center gap-2"
              >
                <input type="hidden" name="id" value={operasyon.id} />
                <label className="text-xs text-muted-foreground">Kategori:</label>
                <select
                  name="kategori"
                  defaultValue={operasyon.kategori}
                  disabled={gozlemci || !sahip}
                  className="rounded-md border bg-background px-2 py-1.5 text-sm disabled:opacity-50"
                >
                  {KATEGORI_LISTE.map((k) => (
                    <option key={k} value={k}>
                      {OPERASYON_KATEGORI_ETIKET[k]}
                    </option>
                  ))}
                </select>
                {sahip && !gozlemci && (
                  <Button type="submit" size="sm" variant="outline">
                    Kaydet
                  </Button>
                )}
              </form>

              {sorumluyuDegistirebilir && (
                <DevirDialog
                  hedefTipi="OPERASYON"
                  hedefId={operasyon.id}
                  hedefBaslik={`${operasyon.teklif.belgeNo} — ${operasyon.teklif.baslik}`}
                  mevcutSorumluId={operasyon.sorumlu.id}
                  kullanicilar={kullanicilar.map((k) => ({
                    id: k.id,
                    name: k.name,
                    rolEtiketi: ROL_ETIKETLERI[k.role],
                  }))}
                  zorlaDevir={yonetici && !sorumlu}
                  triggerLabel={yonetici && !sorumlu ? "Zorla devret" : "Devret"}
                />
              )}

              {/* Yönetici hızlı atama */}
              {yonetici && kullanicilar.length > 0 && (
                <form
                  action={operasyonSorumluDegistirAction}
                  className="flex items-center gap-2"
                >
                  <input type="hidden" name="id" value={operasyon.id} />
                  <label className="text-xs text-muted-foreground">
                    Hızlı ata:
                  </label>
                  <select
                    name="sorumluId"
                    defaultValue={operasyon.sorumlu.id}
                    className="rounded-md border bg-background px-2 py-1.5 text-sm"
                  >
                    {kullanicilar.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name} ({ROL_ETIKETLERI[k.role]})
                      </option>
                    ))}
                  </select>
                  <Button type="submit" size="sm" variant="outline">
                    Ata
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Bağlı teklif */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="size-4" /> Kaynak teklif / sözleşme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/teklifler/${operasyon.teklif.id}`}
                className="text-sm text-primary hover:underline"
              >
                {operasyon.teklif.belgeNo} — {operasyon.teklif.baslik}
              </Link>
            </CardContent>
          </Card>
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
                  href={`/firmalar/${operasyon.teklif.firma.id}`}
                  className="block font-medium hover:underline"
                >
                  {operasyon.teklif.firma.ad}
                </Link>
                {(operasyon.teklif.firma.sektor || operasyon.teklif.firma.sehir) && (
                  <p className="text-xs text-muted-foreground">
                    {[operasyon.teklif.firma.sektor, operasyon.teklif.firma.sehir]
                      .filter(Boolean)
                      .join(" · ")}
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
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="size-4" /> Dosya sorumlusu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 text-sm">
                <Avatar className="size-9">
                  <AvatarFallback>
                    {bashHarfler(operasyon.sorumlu.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium">{operasyon.sorumlu.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {operasyon.sorumlu.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
