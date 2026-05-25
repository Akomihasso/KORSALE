import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import type {
  BelgeDurum,
  BelgeTipi,
  DevirDurum,
  GorusmeDurum,
  GorusmeSonuc,
  GorusmeTipi,
  OperasyonDurum,
} from "@prisma/client";

// ============ TARİH ============

export function trTarih(d: Date | string) {
  return format(typeof d === "string" ? new Date(d) : d, "dd.MM.yyyy", { locale: tr });
}

export function trTarihSaat(d: Date | string) {
  return format(typeof d === "string" ? new Date(d) : d, "dd.MM.yyyy HH:mm", {
    locale: tr,
  });
}

export function trUzunTarih(d: Date | string) {
  return format(typeof d === "string" ? new Date(d) : d, "d MMMM yyyy", { locale: tr });
}

export function trGoreceli(d: Date | string) {
  return formatDistanceToNow(typeof d === "string" ? new Date(d) : d, {
    addSuffix: true,
    locale: tr,
  });
}

// HTML datetime-local input için (yyyy-MM-ddTHH:mm formatı)
export function datetimeLocalInputDegeri(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const tzOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

// ============ PARA ============

const trPara = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function trTutar(v: number | string | { toString(): string } | null | undefined) {
  if (v === null || v === undefined) return "—";
  const num = typeof v === "number" ? v : Number(v.toString());
  if (!Number.isFinite(num)) return "—";
  return trPara.format(num);
}

const trSayi = new Intl.NumberFormat("tr-TR");
export function trAdet(v: number) {
  return trSayi.format(v);
}

// ============ ENUM ETİKETLERİ ============

export const GORUSME_TIPI_ETIKET: Record<GorusmeTipi, string> = {
  YUZ_YUZE: "Yüz yüze",
  TELEFON: "Telefon",
  ONLINE: "Online",
  EMAIL: "E-posta",
  DIGER: "Diğer",
};

export const GORUSME_SONUC_ETIKET: Record<GorusmeSonuc, string> = {
  TEKLIF_ISTENDI: "Teklif istendi",
  BILGI_VERILDI: "Bilgi verildi",
  ILGISIZ: "İlgisiz",
  ERTELENDI: "Ertelendi",
  REDDEDILDI: "Reddedildi",
  TEKRAR_ARANACAK: "Tekrar aranacak",
};

export const GORUSME_DURUM_ETIKET: Record<GorusmeDurum, string> = {
  ACIK: "Açık",
  KAPALI: "Kapalı",
};

export const BELGE_TIPI_ETIKET: Record<BelgeTipi, string> = {
  TEKLIF: "Teklif",
  TALIMAT: "Talimat",
  SOZLESME: "Sözleşme",
};

export const BELGE_DURUM_ETIKET: Record<BelgeDurum, string> = {
  TASLAK: "Taslak",
  ONAY_BEKLIYOR: "Onay bekliyor",
  GONDERILDI: "Gönderildi",
  BEKLEMEDE: "Beklemede",
  KABUL: "Kabul",
  REDDEDILDI: "Reddedildi",
  IPTAL: "İptal",
  SURESI_DOLDU: "Süresi doldu",
};

export const OPERASYON_DURUM_ETIKET: Record<OperasyonDurum, string> = {
  BEKLIYOR: "Bekliyor",
  DEVAM_EDIYOR: "Devam ediyor",
  ASKIDA: "Askıda",
  TAMAMLANDI: "Tamamlandı",
  IPTAL: "İptal",
};

export const DEVIR_DURUM_ETIKET: Record<DevirDurum, string> = {
  BEKLIYOR: "Bekliyor",
  KABUL: "Kabul edildi",
  REDDEDILDI: "Reddedildi",
  GERI_ALINDI: "Geri alındı",
  ZORLA_DEVIR: "Zorla devir",
};

// ============ DURUM BADGE RENGİ ============

export function gorusmeDurumRengi(d: GorusmeDurum): "default" | "secondary" | "outline" {
  return d === "ACIK" ? "default" : "outline";
}

export function gorusmeSonucRengi(
  s: GorusmeSonuc,
): "default" | "secondary" | "destructive" | "outline" {
  switch (s) {
    case "TEKLIF_ISTENDI":
      return "default";
    case "BILGI_VERILDI":
    case "TEKRAR_ARANACAK":
      return "secondary";
    case "ILGISIZ":
    case "REDDEDILDI":
      return "destructive";
    case "ERTELENDI":
      return "outline";
  }
}

// ============ İSİM KISALTMA ============

export function bashHarfler(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}
