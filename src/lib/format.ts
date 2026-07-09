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
  OperasyonKategori,
  TeklifRedKategori,
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

const DESTEKLENEN_PARA_BIRIMLERI = new Set(["TRY", "USD", "EUR", "GBP"]);

const formatterCache = new Map<string, Intl.NumberFormat>();
function paraFormatter(paraBirimi: string) {
  const kod = paraBirimi.toUpperCase();
  const guvenliKod = DESTEKLENEN_PARA_BIRIMLERI.has(kod) ? kod : "TRY";
  let fmt = formatterCache.get(guvenliKod);
  if (!fmt) {
    fmt = new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: guvenliKod,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    formatterCache.set(guvenliKod, fmt);
  }
  return fmt;
}

export function trTutar(
  v: number | string | { toString(): string } | null | undefined,
  paraBirimi: string = "TRY",
) {
  if (v === null || v === undefined) return "—";
  const num = typeof v === "number" ? v : Number(v.toString());
  if (!Number.isFinite(num)) return "—";
  return paraFormatter(paraBirimi).format(num);
}

const trSayi = new Intl.NumberFormat("tr-TR");
export function trAdet(v: number) {
  return trSayi.format(v);
}

export function trYuzde(v: number | string | { toString(): string } | null | undefined) {
  if (v === null || v === undefined) return "—";
  const num = typeof v === "number" ? v : Number(v.toString());
  if (!Number.isFinite(num)) return "—";
  return `%${num.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
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

// Teklif ödeme durumu için hazır etiketler. "Para alındı" akışı ayrı — bu alan,
// müşteriden farklı ödeme senaryolarını (plan bekleniyor, fatura sonrası vb.) izlemek için.
export const TEKLIF_ODEME_DURUM_SECENEKLERI = [
  "Ödeme alındı",
  "Ödeme planı bekleniyor",
  "Faturadan sonra ödenecek",
  "Kısmi ödeme alındı",
  "Ödeme ertelendi",
  "Ödeme iptal edildi",
] as const;

export const TEKLIF_RED_KATEGORI_ETIKET: Record<TeklifRedKategori, string> = {
  USTMAKAM_ONAY: "Üst makam onayı bekliyor",
  DUSUNUYOR: "Düşünüyor",
  PARA_BEKLIYOR: "Bütçe / ödeme bekliyor",
  FIYAT_YUKSEK: "Fiyatımız yüksek bulundu",
  BASKA_FIRMA: "Başka firmayı tercih etti",
  ULASILAMIYOR: "Ulaşılamıyor",
  DIGER: "Diğer",
};

/**
 * Müşteri akışındaki gerçek aşamayı — enum'a göre değil, durum + odemeAlindiTar +
 * operasyon kombinasyonuna göre — özetler. Liste sütunu ve detay sayfasındaki tek
 * rozet için kaynak budur.
 */
export type TeklifAsama =
  | "HAZIRLANIYOR"
  | "INDIRIM_ONAY"
  | "TEKLIF_BEKLIYOR"
  | "ONAYLANDI"
  | "PARA_ALINDI"
  | "OPERASYONDA"
  | "TAMAMLANDI"
  | "REDDEDILDI"
  | "IPTAL"
  | "SURESI_DOLDU";

export const TEKLIF_ASAMA_ETIKET: Record<TeklifAsama, string> = {
  HAZIRLANIYOR: "Hazırlanıyor",
  INDIRIM_ONAY: "İndirim onayı bekliyor",
  TEKLIF_BEKLIYOR: "Teklif bekliyor",
  ONAYLANDI: "Onaylandı · ödeme bekliyor",
  PARA_ALINDI: "Para alındı · operasyona aktarıldı",
  OPERASYONDA: "Operasyonda",
  TAMAMLANDI: "Tamamlandı",
  REDDEDILDI: "Reddedildi",
  IPTAL: "İptal",
  SURESI_DOLDU: "Süresi doldu",
};

/**
 * Detay/liste için tek noktadan üretilen "müşteri akışı aşaması".
 * Operasyon durumu da bilinerek çağrılırsa OPERASYONDA / TAMAMLANDI ayırt edilir.
 */
export function teklifAsamasi(input: {
  durum: BelgeDurum;
  odemeAlindiTar: Date | string | null;
  operasyonDurum?: OperasyonDurum | null;
}): TeklifAsama {
  switch (input.durum) {
    case "TASLAK":
      return "HAZIRLANIYOR";
    case "ONAY_BEKLIYOR":
      return "INDIRIM_ONAY";
    case "GONDERILDI":
    case "BEKLEMEDE":
      return "TEKLIF_BEKLIYOR";
    case "KABUL": {
      if (!input.odemeAlindiTar) return "ONAYLANDI";
      if (input.operasyonDurum === "TAMAMLANDI") return "TAMAMLANDI";
      if (
        input.operasyonDurum === "DEVAM_EDIYOR" ||
        input.operasyonDurum === "ASKIDA"
      ) {
        return "OPERASYONDA";
      }
      return "PARA_ALINDI";
    }
    case "REDDEDILDI":
      return "REDDEDILDI";
    case "IPTAL":
      return "IPTAL";
    case "SURESI_DOLDU":
      return "SURESI_DOLDU";
  }
}

// Tailwind sınıfları (renk + arka plan) — tek nokta.
export const TEKLIF_DURUM_GORUNUM: Record<
  TeklifAsama,
  { sinif: string; rozet: "default" | "secondary" | "destructive" | "outline" }
> = {
  HAZIRLANIYOR: { sinif: "text-muted-foreground", rozet: "outline" },
  INDIRIM_ONAY: {
    sinif: "text-amber-600 dark:text-amber-400",
    rozet: "secondary",
  },
  TEKLIF_BEKLIYOR: {
    sinif: "text-sky-600 dark:text-sky-400",
    rozet: "secondary",
  },
  ONAYLANDI: {
    sinif: "text-amber-600 dark:text-amber-400",
    rozet: "default",
  },
  PARA_ALINDI: {
    sinif: "text-emerald-600 dark:text-emerald-400",
    rozet: "default",
  },
  OPERASYONDA: {
    sinif: "text-emerald-600 dark:text-emerald-400",
    rozet: "default",
  },
  TAMAMLANDI: {
    sinif: "text-emerald-700 dark:text-emerald-300",
    rozet: "default",
  },
  REDDEDILDI: {
    sinif: "text-destructive",
    rozet: "destructive",
  },
  IPTAL: { sinif: "text-muted-foreground", rozet: "destructive" },
  SURESI_DOLDU: { sinif: "text-muted-foreground", rozet: "destructive" },
};

export function teklifAsamaRengi(a: TeklifAsama) {
  return TEKLIF_DURUM_GORUNUM[a].rozet;
}

export const OPERASYON_DURUM_ETIKET: Record<OperasyonDurum, string> = {
  BEKLIYOR: "Bekliyor",
  DEVAM_EDIYOR: "Devam ediyor",
  ASKIDA: "Askıda",
  TAMAMLANDI: "Tamamlandı",
  IPTAL: "İptal",
};

// Operasyonun serbest metin "son durum" alanına atanabilecek hazır seçenekler.
// UI'da dropdown olarak gösterilir; kullanıcı isterse "Özel..." seçip serbest metin de yazabilir.
export const OPERASYON_SON_DURUM_SECENEKLERI = [
  "Operasyon devam ediyor",
  "Bilgi-belge bekleniyor",
  "Müşteri onayı bekleniyor",
  "Kurum cevabı bekleniyor",
  "Ödeme bekleniyor",
  "Askıya alındı",
] as const;

export const OPERASYON_KATEGORI_ETIKET: Record<OperasyonKategori, string> = {
  MARKA: "Marka",
  PATENT: "Patent",
  TASARIM: "Tasarım",
  DANISMANLIK: "Danışmanlık",
  DIGER: "Diğer",
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

export function belgeDurumRengi(
  d: BelgeDurum,
): "default" | "secondary" | "destructive" | "outline" {
  switch (d) {
    case "TASLAK":
      return "outline";
    case "ONAY_BEKLIYOR":
    case "GONDERILDI":
    case "BEKLEMEDE":
      return "secondary";
    case "KABUL":
      return "default";
    case "REDDEDILDI":
    case "IPTAL":
    case "SURESI_DOLDU":
      return "destructive";
  }
}

export function belgeTipiRengi(t: BelgeTipi): "default" | "secondary" | "outline" {
  switch (t) {
    case "TEKLIF":
      return "default";
    case "SOZLESME":
      return "secondary";
    case "TALIMAT":
      return "outline";
  }
}

export function devirDurumRengi(
  d: DevirDurum,
): "default" | "secondary" | "destructive" | "outline" {
  switch (d) {
    case "BEKLIYOR":
      return "secondary";
    case "KABUL":
    case "ZORLA_DEVIR":
      return "default";
    case "REDDEDILDI":
    case "GERI_ALINDI":
      return "destructive";
  }
}

export function operasyonDurumRengi(
  d: OperasyonDurum,
): "default" | "secondary" | "destructive" | "outline" {
  switch (d) {
    case "BEKLIYOR":
      return "outline";
    case "DEVAM_EDIYOR":
      return "default";
    case "ASKIDA":
      return "secondary";
    case "TAMAMLANDI":
      return "default";
    case "IPTAL":
      return "destructive";
  }
}

export function kabulOlasilikRengi(yuzde: number): string {
  if (yuzde >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (yuzde >= 50) return "text-amber-600 dark:text-amber-400";
  if (yuzde >= 25) return "text-orange-600 dark:text-orange-400";
  return "text-muted-foreground";
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
