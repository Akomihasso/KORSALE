"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav";
import { Badge } from "@/components/ui/badge";

type Props = {
  devirBekleyenSayisi?: number;
  onNavigate?: () => void;
};

export function AppSidebar({ devirBekleyenSayisi = 0, onNavigate }: Props) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-100">
      <div className="flex h-14 items-center border-b border-white/10 px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          KORSALE
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-white/10 text-white"
                      : "text-slate-300 hover:bg-white/5 hover:text-white",
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
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-3 text-xs text-slate-400">
        v1.0 • Kordinat
      </div>
    </div>
  );
}
