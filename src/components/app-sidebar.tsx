"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { NAV_ITEMS, type NavItem, filtreNavItems } from "@/lib/nav";
import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@prisma/client";

type Props = {
  devirBekleyenSayisi?: number;
  userRole: UserRole;
  onNavigate?: () => void;
};

function isActive(item: NavItem, pathname: string): boolean {
  if (item.href === "/") return pathname === "/";
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AppSidebar({ devirBekleyenSayisi = 0, userRole, onNavigate }: Props) {
  const pathname = usePathname();
  const items = filtreNavItems(NAV_ITEMS, userRole);

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          KORSALE
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item, pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1">{item.title}</span>
                  {item.badge === "devir" && devirBekleyenSayisi > 0 && (
                    <Badge
                      variant="destructive"
                      className="h-5 min-w-5 justify-center px-1.5 text-[10px]"
                    >
                      {devirBekleyenSayisi}
                    </Badge>
                  )}
                </Link>

                {item.children && item.children.length > 0 && (
                  <ul className="mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3 ml-5">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const childActive = isActive(child, pathname);
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={onNavigate}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors",
                              childActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                            )}
                          >
                            <ChildIcon className="size-3.5 shrink-0" />
                            <span className="flex-1">{child.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-3 text-xs text-sidebar-foreground/50">
        v1.0 • Kordinat
      </div>
    </div>
  );
}
