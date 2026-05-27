import {
  BookOpen,
  ClipboardCheck,
  Construction,
  FileSignature,
  FileText,
  GitBranch,
  Mail,
  ScrollText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { requireAuth } from "@/lib/auth-helpers";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "KORSİSTEM" };

type Modul = {
  baslik: string;
  aciklama: string;
  icon: LucideIcon;
  durum: "yapilacak" | "taslak";
  not?: string;
};

const MODULLER: Modul[] = [
  {
    baslik: "Yönetmelik & Talimat",
    aciklama:
      "Şirket içi yönetmelikler, çalışma talimatları ve prosedürler. Yeni başlayan personelin ilk başvuru noktası.",
    icon: BookOpen,
    durum: "yapilacak",
  },
  {
    baslik: "Sistem Tarifleri",
    aciklama:
      "Hangi işin nasıl yapıldığını adım adım anlatan tarifler. Marka tescil, patent başvurusu, yenileme süreçleri gibi.",
    icon: ScrollText,
    durum: "yapilacak",
  },
  {
    baslik: "Akış Şemaları",
    aciklama:
      "İş süreçlerinin görsel akışı. Görüşmeden teklife, kabulden operasyona kadar tüm aşamaların şeması.",
    icon: GitBranch,
    durum: "yapilacak",
  },
  {
    baslik: "Yazışma Standartları",
    aciklama:
      "E-posta, mektup ve resmî yazı şablonları. Kurumsal dil tutarlılığı için hazır kalıplar.",
    icon: Mail,
    durum: "yapilacak",
  },
  {
    baslik: "Teklif Şablonları",
    aciklama:
      "Marka, patent, tasarım ve danışmanlık için hazır teklif şablonları. Yeni teklif oluşturulurken otomatik dolar.",
    icon: FileText,
    durum: "yapilacak",
  },
  {
    baslik: "Talimat Şablonları",
    aciklama:
      "Operasyon başladığında çalışana iletilen iş talimatlarının hazır kalıpları.",
    icon: ClipboardCheck,
    durum: "yapilacak",
  },
  {
    baslik: "Sözleşme Standartları",
    aciklama:
      "Hizmet sözleşmesi, vekâletname, gizlilik anlaşması gibi yasal belge şablonları ve şartnameler.",
    icon: FileSignature,
    durum: "yapilacak",
  },
];

const DURUM_ROZET: Record<Modul["durum"], { etiket: string; renk: string }> = {
  yapilacak: {
    etiket: "Yapılacak",
    renk: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  },
  taslak: {
    etiket: "Taslak",
    renk: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400",
  },
};

export default async function KorsistemPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">KORSİSTEM</h1>
        <p className="text-sm text-muted-foreground">
          Kordinat&apos;ın iç işleyiş kuralları, prosedürleri ve şablonları — tek noktada
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex items-start gap-3 p-4">
          <Construction className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Modül altyapısı Sprint 6&apos;da geliyor</p>
            <p className="text-xs text-muted-foreground">
              Markdown editör (Tiptap), versiyonlama, aktif/pasif durum ve arama bütün modüllere
              ortak olarak gelecek. Aşağıdaki kartlar planlanan modülleri ve içeriklerini gösteriyor.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULLER.map((m) => {
          const Icon = m.icon;
          const rozet = DURUM_ROZET[m.durum];
          return (
            <Card
              key={m.baslik}
              className="group flex flex-col transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <Badge className={`${rozet.renk} border-0 font-normal`}>
                    {rozet.etiket}
                  </Badge>
                </div>
                <CardTitle className="text-base">{m.baslik}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pt-0">
                <CardDescription className="text-xs leading-relaxed">
                  {m.aciklama}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
