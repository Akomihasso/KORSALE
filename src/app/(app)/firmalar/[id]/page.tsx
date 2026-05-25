import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Globe,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Star,
  Trash2,
} from "lucide-react";

import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  trTarihSaat,
  trTutar,
  GORUSME_SONUC_ETIKET,
  GORUSME_DURUM_ETIKET,
  GORUSME_TIPI_ETIKET,
  gorusmeSonucRengi,
  gorusmeDurumRengi,
  bashHarfler,
} from "@/lib/format";
import { firmaKisiSilAction } from "@/lib/actions/firma-kisi-actions";
import { FirmaFormDialog } from "@/components/firma-form-dialog";
import { FirmaKisiDialog } from "@/components/firma-kisi-dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const f = await prisma.firma.findUnique({ where: { id }, select: { ad: true } });
  return { title: f?.ad ?? "Firma" };
}

export default async function FirmaDetayPage({ params }: { params: Params }) {
  await requireAuth();
  const { id } = await params;

  const firma = await prisma.firma.findUnique({
    where: { id },
    include: {
      kisiler: { orderBy: [{ birincil: "desc" }, { ad: "asc" }] },
      gorusmeler: {
        orderBy: { tarih: "desc" },
        take: 30,
        include: {
          sorumlu: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!firma) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/firmalar"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Firmalar
      </Link>

      {/* ÜST: FİRMA BİLGİ */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-3 text-primary">
              <Building2 className="size-6" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl">{firma.ad}</CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-2">
                {firma.sektor && <span>{firma.sektor}</span>}
                {firma.sektor && firma.sehir && <span>•</span>}
                {firma.sehir && <span>{firma.sehir}</span>}
                {firma.kaynak && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className="font-normal">
                      {firma.kaynak}
                    </Badge>
                  </>
                )}
              </CardDescription>
            </div>
          </div>
          <FirmaFormDialog mode="edit" firma={firma} />
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          {firma.vergiNo && (
            <div>
              <span className="text-muted-foreground">Vergi/TC no: </span>
              <span className="font-mono">{firma.vergiNo}</span>
            </div>
          )}
          {firma.telefon && (
            <div className="flex items-center gap-2">
              <Phone className="size-4 text-muted-foreground" />
              <a href={`tel:${firma.telefon}`} className="hover:underline">
                {firma.telefon}
              </a>
            </div>
          )}
          {firma.email && (
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              <a href={`mailto:${firma.email}`} className="hover:underline">
                {firma.email}
              </a>
            </div>
          )}
          {firma.web && (
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-muted-foreground" />
              <a
                href={firma.web}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {firma.web}
              </a>
            </div>
          )}
          {firma.notlar && (
            <div className="sm:col-span-2 rounded-md bg-muted/50 p-3 text-muted-foreground">
              {firma.notlar}
            </div>
          )}
        </CardContent>
      </Card>

      {/* KİŞİLER */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Kişiler</CardTitle>
            <CardDescription>
              {firma.kisiler.length === 0
                ? "Henüz kişi eklenmemiş"
                : `${firma.kisiler.length} kişi`}
            </CardDescription>
          </div>
          <FirmaKisiDialog mode="create" firmaId={firma.id} />
        </CardHeader>
        {firma.kisiler.length > 0 && (
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>Unvan</TableHead>
                  <TableHead>İletişim</TableHead>
                  <TableHead className="w-24 text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {firma.kisiler.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium">
                        {k.birincil && (
                          <Star className="size-3.5 fill-amber-400 text-amber-500" />
                        )}
                        {k.ad}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {k.unvan ?? "—"}
                    </TableCell>
                    <TableCell className="space-y-0.5 text-xs">
                      {k.telefon && <div>{k.telefon}</div>}
                      {k.email && (
                        <div className="text-muted-foreground">{k.email}</div>
                      )}
                      {!k.telefon && !k.email && (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="flex items-center justify-end gap-1">
                      <FirmaKisiDialog
                        mode="edit"
                        firmaId={firma.id}
                        kisi={{
                          id: k.id,
                          ad: k.ad,
                          unvan: k.unvan,
                          telefon: k.telefon,
                          email: k.email,
                          birincil: k.birincil,
                        }}
                      />
                      <form action={firmaKisiSilAction}>
                        <input type="hidden" name="id" value={k.id} />
                        <input type="hidden" name="firmaId" value={firma.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Sil"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>

      {/* GÖRÜŞMELER TIMELINE */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Görüşmeler</CardTitle>
            <CardDescription>
              {firma.gorusmeler.length === 0
                ? "Henüz görüşme yok"
                : `Son ${firma.gorusmeler.length} görüşme`}
            </CardDescription>
          </div>
          <Button render={<Link href={`/gorusmeler/yeni?firmaId=${firma.id}`} />}>
            <Plus className="size-4" /> Yeni Görüşme
          </Button>
        </CardHeader>
        <CardContent>
          {firma.gorusmeler.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
              <MessageSquare className="size-8 opacity-30" />
              <p className="text-sm">
                Henüz görüşme yok. Sağ üstten yeni görüşme ekleyin.
              </p>
            </div>
          ) : (
            <ol className="space-y-3">
              {firma.gorusmeler.map((g) => (
                <li key={g.id}>
                  <Link
                    href={`/gorusmeler/${g.id}`}
                    className="flex gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <Avatar className="mt-0.5 size-8">
                      <AvatarFallback className="text-xs">
                        {bashHarfler(g.sorumlu.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{g.konu}</span>
                        <Badge variant={gorusmeSonucRengi(g.sonuc)}>
                          {GORUSME_SONUC_ETIKET[g.sonuc]}
                        </Badge>
                        <Badge variant={gorusmeDurumRengi(g.durum)}>
                          {GORUSME_DURUM_ETIKET[g.durum]}
                        </Badge>
                      </div>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {g.ozet}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>{trTarihSaat(g.tarih)}</span>
                        <span>•</span>
                        <span>{GORUSME_TIPI_ETIKET[g.tip]}</span>
                        <span>•</span>
                        <span>{g.sorumlu.name}</span>
                        {g.tahminiTutar && (
                          <>
                            <span>•</span>
                            <span>Tahmini: {trTutar(g.tahminiTutar)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
