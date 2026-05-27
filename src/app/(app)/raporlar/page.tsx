import {
  BarChart3,
  Calendar,
  Construction,
  Download,
  Filter,
  Repeat,
  TrendingUp,
  Users,
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

export const metadata = { title: "Raporlar" };

type Rapor = {
  baslik: string;
  aciklama: string;
  icon: LucideIcon;
  metrikler?: string[];
  durum: "yapilacak" | "taslak";
};

const RAPORLAR: Rapor[] = [
  {
    baslik: "Çalışan Performansı",
    aciklama:
      "Her satış/operasyon çalışanının üç farklı metrikle değerlendirildiği rapor — komisyon kavgalarını engeller.",
    icon: Users,
    metrikler: ["İlk temas tutarı", "Kapatan kişi tutarı", "Şu an sorumlu tutarı"],
    durum: "yapilacak",
  },
  {
    baslik: "Aylık Dönüşüm Grafiği",
    aciklama:
      "Görüşme → Teklif → Kabul zincirindeki dönüşüm oranlarının zaman içindeki değişimi.",
    icon: TrendingUp,
    durum: "yapilacak",
  },
  {
    baslik: "Devir Analizi",
    aciklama:
      "Kim kime kaç kere devretti, ortalama cevap süresi, red oranı, zorla devir sayısı. Ekip içi iş yükü dengesini gösterir.",
    icon: Repeat,
    durum: "yapilacak",
  },
  {
    baslik: "Funnel Analizi",
    aciklama:
      "Satış hunisinde hangi aşamada en çok kayıp yaşandığı, kategori bazlı (Marka/Patent/Tasarım/Danışmanlık) dağılım.",
    icon: Filter,
    durum: "yapilacak",
  },
  {
    baslik: "Haftalık / Aylık Özet",
    aciklama:
      "Belirlenen dönemin tek sayfalık özeti: yeni görüşme, çıkan teklif, kazanılan iş, tamamlanan operasyon. PDF olarak indirilebilir.",
    icon: Calendar,
    metrikler: ["PDF export", "Excel export"],
    durum: "yapilacak",
  },
  {
    baslik: "Operasyon Yoğunluğu",
    aciklama:
      "Aktif operasyonların kategori ve sorumluya göre dağılımı; askıdaki operasyonların gecikme analizi.",
    icon: BarChart3,
    durum: "yapilacak",
  },
  {
    baslik: "Veri İndirme",
    aciklama:
      "Firma, görüşme, teklif ve operasyon listelerini filtreli CSV/Excel olarak indirme. Dış paylaşım ve yedek için.",
    icon: Download,
    metrikler: ["CSV", "Excel (.xlsx)"],
    durum: "yapilacak",
  },
];

const DURUM_ROZET: Record<Rapor["durum"], { etiket: string; renk: string }> = {
  yapilacak: {
    etiket: "Yapılacak",
    renk: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  },
  taslak: {
    etiket: "Taslak",
    renk: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400",
  },
};

export default async function RaporlarPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Raporlar</h1>
        <p className="text-sm text-muted-foreground">
          Satış, operasyon ve ekip performansı için hazır raporlar — PDF/Excel olarak çıkarılabilir
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex items-start gap-3 p-4">
          <Construction className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Raporlama altyapısı Sprint 5&apos;te geliyor</p>
            <p className="text-xs text-muted-foreground">
              Her rapor önce ekranda görselleşecek (recharts), sonra PDF&apos;e dökülebilecek.
              Aşağıdaki kartlar planlanan raporları ve içeriklerini gösteriyor.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RAPORLAR.map((r) => {
          const Icon = r.icon;
          const rozet = DURUM_ROZET[r.durum];
          return (
            <Card
              key={r.baslik}
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
                <CardTitle className="text-base">{r.baslik}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pt-0">
                <CardDescription className="text-xs leading-relaxed">
                  {r.aciklama}
                </CardDescription>
                {r.metrikler && r.metrikler.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {r.metrikler.map((m) => (
                      <span
                        key={m}
                        className="rounded-md border bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
