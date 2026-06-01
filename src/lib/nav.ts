import {
  Bell,
  Briefcase,
  Building2,
  ClipboardList,
  FileText,
  Filter,
  Home,
  Inbox,
  LayoutTemplate,
  MessageSquare,
  PieChart,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@prisma/client";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: "devir";
  children?: NavItem[];
  roles?: UserRole[]; // tanımlıysa sadece bu rollere gösterilir
};

export const NAV_ITEMS: NavItem[] = [
  {
    title: "GENEL DURUM",
    href: "/",
    icon: Home,
  },
  { title: "Funnel", href: "/funnel", icon: Filter },
  { title: "Görüşmeler", href: "/gorusmeler", icon: MessageSquare },
  { title: "Teklifler", href: "/teklifler", icon: FileText },
  { title: "Operasyonlar", href: "/operasyonlar", icon: ClipboardList },
  {
    title: "İş Devri",
    href: "/is-devri",
    icon: Inbox,
    badge: "devir",
  },
  { title: "Firmalar", href: "/firmalar", icon: Building2 },
  {
    title: "EKİP ÜYELERİ",
    href: "/ekip-uyeleri",
    icon: Users,
    roles: ["YONETICI"],
  },
  { title: "KORSİSTEM", href: "/korsistem", icon: LayoutTemplate },
  { title: "Raporlar", href: "/raporlar", icon: PieChart },
];

export function filtreNavItems(items: NavItem[], role: UserRole): NavItem[] {
  return items.filter((item) => !item.roles || item.roles.includes(role));
}

export { Bell, Briefcase };
