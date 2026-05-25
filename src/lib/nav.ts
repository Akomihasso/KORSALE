import {
  Bell,
  Building2,
  ClipboardList,
  FileText,
  Filter,
  Home,
  Inbox,
  MessageSquare,
  PieChart,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: "devir"; // dinamik badge tipi
};

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/", icon: Home },
  { title: "Funnel", href: "/funnel", icon: Filter },
  { title: "Firmalar", href: "/firmalar", icon: Building2 },
  { title: "Görüşmeler", href: "/gorusmeler", icon: MessageSquare },
  { title: "Teklifler", href: "/teklifler", icon: FileText },
  { title: "Operasyonlar", href: "/operasyonlar", icon: ClipboardList },
  {
    title: "Bana Gelen Devirler",
    href: "/bana-gelen-devirler",
    icon: Inbox,
    badge: "devir",
  },
  { title: "Dokümanlar", href: "/dokumanlar", icon: FileText },
  { title: "Raporlar", href: "/raporlar", icon: PieChart },
  { title: "Ayarlar", href: "/ayarlar", icon: Settings },
];

export { Bell };
