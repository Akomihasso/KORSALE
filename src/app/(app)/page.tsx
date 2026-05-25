import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Dashboard",
};

const KPI_LIST = [
  { baslik: "Bu ay görüşme", deger: "—", aciklama: "Sprint 5'te aktif" },
  { baslik: "Açık teklif", deger: "—", aciklama: "Sprint 5'te aktif" },
  { baslik: "Bu ay kapatılan", deger: "—", aciklama: "Sprint 5'te aktif" },
  { baslik: "Devam eden operasyon", deger: "—", aciklama: "Sprint 5'te aktif" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Hoş geldiniz. Bu sayfa Sprint 5{"'"}te KPI kartları, funnel ve aktivite akışı ile dolacak.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {KPI_LIST.map((kpi) => (
          <Card key={kpi.baslik}>
            <CardHeader className="pb-2">
              <CardDescription>{kpi.baslik}</CardDescription>
              <CardTitle className="text-3xl">{kpi.deger}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{kpi.aciklama}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sprint 1 — Kurulum tamamlandı</CardTitle>
          <CardDescription>
            Sıradaki adımlar: Firma + Görüşme CRUD (Sprint 2), Teklif + Devir (Sprint 3),
            Operasyon (Sprint 4), Funnel + Raporlar (Sprint 5).
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
