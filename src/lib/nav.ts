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
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: "devir";
  children?: NavItem[];
};

export const NAV_ITEMS: NavItem[] = [
  {
    title: "GENEL DURUM",
    href: "/",
    icon: Home,
    children: [{ title: "Funnel", href: "/funnel", icon: Filter }],
  },
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
  { title: "KORSİSTEM", href: "/korsistem", icon: LayoutTemplate },
  { title: "Raporlar", href: "/raporlar", icon: PieChart },
];

export { Bell, Briefcase };
