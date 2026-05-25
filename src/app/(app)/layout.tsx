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
  const [devirBekleyenSayisi, bildirimSayisi] = await Promise.all([
    prisma.gorevDevir.count({
      where: { devralanId: user.id, durum: "BEKLIYOR" },
    }),
    prisma.bildirim.count({
      where: { userId: user.id, okundu: false },
    }),
  ]);

  return (
    <div className="flex h-screen">
      <aside className="hidden w-64 shrink-0 md:block">
        <AppSidebar devirBekleyenSayisi={devirBekleyenSayisi} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar
          user={{
            name: user.name ?? "Kullanıcı",
            email: user.email ?? "",
            rolEtiketi: ROL_ETIKETLERI[user.role],
          }}
          bildirimSayisi={bildirimSayisi}
          devirBekleyenSayisi={devirBekleyenSayisi}
        />
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="mx-auto w-full max-w-7xl p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
