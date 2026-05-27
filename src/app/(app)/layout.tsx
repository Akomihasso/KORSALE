import { requireAuth, ROL_ETIKETLERI } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  // Sidebar ve topbar için sayıları paralel çek
  const [devirBekleyenSayisi, bildirimSayisi, sonBildirimler] = await Promise.all([
    prisma.gorevDevir.count({
      where: { devralanId: user.id, durum: "BEKLIYOR" },
    }),
    prisma.bildirim.count({
      where: { userId: user.id, okundu: false },
    }),
    prisma.bildirim.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  return (
    <div className="flex h-screen bg-background p-2 gap-2 md:p-3 md:gap-3">
      <aside className="hidden w-60 shrink-0 overflow-hidden rounded-2xl shadow-sm md:block">
        <AppSidebar devirBekleyenSayisi={devirBekleyenSayisi} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-sm">
        <AppTopbar
          user={{
            name: user.name ?? "Kullanıcı",
            email: user.email ?? "",
            rolEtiketi: ROL_ETIKETLERI[user.role],
          }}
          bildirimSayisi={bildirimSayisi}
          bildirimler={sonBildirimler}
          devirBekleyenSayisi={devirBekleyenSayisi}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
