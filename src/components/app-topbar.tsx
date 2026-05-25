"use client";

import { useState } from "react";
import { Bell, Menu, Search } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { UserMenu } from "@/components/user-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type Props = {
  user: { name: string; email: string; rolEtiketi: string };
  bildirimSayisi: number;
  devirBekleyenSayisi: number;
};

export function AppTopbar({ user, bildirimSayisi, devirBekleyenSayisi }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4">
      {/* Mobile drawer trigger */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" className="md:hidden" />}
        >
          <Menu className="size-5" />
          <span className="sr-only">Menüyü aç</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigasyon</SheetTitle>
          <AppSidebar
            devirBekleyenSayisi={devirBekleyenSayisi}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Global arama (placeholder, Sprint 5'te etkin) */}
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Firma, kişi, belge no ara..."
          className="pl-9"
          disabled
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {bildirimSayisi > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-0.5 -right-0.5 h-4 min-w-4 justify-center px-1 text-[10px]"
            >
              {bildirimSayisi > 9 ? "9+" : bildirimSayisi}
            </Badge>
          )}
          <span className="sr-only">Bildirimler</span>
        </Button>

        <UserMenu name={user.name} email={user.email} rolEtiketi={user.rolEtiketi} />
      </div>
    </header>
  );
}
