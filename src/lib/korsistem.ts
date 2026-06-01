import {
  BookOpen,
  ClipboardCheck,
  FileSignature,
  FileText,
  GitBranch,
  Mail,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import type { DokumanKategori } from "@prisma/client";

type KategoriBilgi = {
  slug: string;
  baslik: string;
  aciklama: string;
  icon: LucideIcon;
};

export const KORSISTEM_KATEGORI: Record<DokumanKategori, KategoriBilgi> = {
  YONETMELIK_TALIMAT: {
    slug: "yonetmelik-talimat",
    baslik: "Yönetmelik & Talimat",
    aciklama: "Şirket içi yönetmelikler, çalışma talimatları ve prosedürler.",
    icon: BookOpen,
  },
  SISTEM_TARIF: {
    slug: "sistem-tarif",
    baslik: "Sistem Tarifleri",
    aciklama: "Marka tescil, patent başvurusu, yenileme süreçlerinin adım adım tarifleri.",
    icon: ScrollText,
  },
  AKIS_SEMASI: {
    slug: "akis-semasi",
    baslik: "Akış Şemaları",
    aciklama: "İş süreçlerinin görsel akış şemaları.",
    icon: GitBranch,
  },
  YAZISMA_STANDART: {
    slug: "yazisma-standart",
    baslik: "Yazışma Standartları",
    aciklama: "E-posta, mektup ve resmî yazı şablonları.",
    icon: Mail,
  },
  TEKLIF_SABLON: {
    slug: "teklif-sablon",
    baslik: "Teklif Şablonları",
    aciklama: "Marka, patent, tasarım ve danışmanlık için hazır teklif şablonları.",
    icon: FileText,
  },
  TALIMAT_SABLON: {
    slug: "talimat-sablon",
    baslik: "Talimat Şablonları",
    aciklama: "Operasyon başladığında çalışana iletilen iş talimatlarının kalıpları.",
    icon: ClipboardCheck,
  },
  SOZLESME_STANDART: {
    slug: "sozlesme-standart",
    baslik: "Sözleşme Standartları",
    aciklama: "Hizmet sözleşmesi, vekâletname, gizlilik anlaşması gibi yasal belge şablonları.",
    icon: FileSignature,
  },
};

export const KORSISTEM_KATEGORI_LISTE = Object.entries(KORSISTEM_KATEGORI).map(
  ([enumDeger, bilgi]) => ({
    enum: enumDeger as DokumanKategori,
    ...bilgi,
  }),
);

export function slugdanKategori(slug: string): DokumanKategori | null {
  for (const [enumDeger, bilgi] of Object.entries(KORSISTEM_KATEGORI)) {
    if (bilgi.slug === slug) return enumDeger as DokumanKategori;
  }
  return null;
}

export function dosyaBoyutOku(byte: number | null | undefined): string {
  if (!byte || byte <= 0) return "—";
  if (byte < 1024) return `${byte} B`;
  if (byte < 1024 * 1024) return `${Math.round(byte / 1024)} KB`;
  return `${(byte / (1024 * 1024)).toFixed(1)} MB`;
}
