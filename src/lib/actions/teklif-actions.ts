"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import {
  belgeNoUret,
  indirimOnayYuzdesi,
  netTutarHesapla,
} from "@/lib/belge";
import {
  BelgeDurum,
  BelgeTipi,
  BildirimTipi,
  OperasyonDurum,
  OperasyonKategori,
  TeklifRedKategori,
  UserRole,
} from "@prisma/client";
import { parseFormData, type ActionState } from "./_shared";

const RED_KATEGORI_DEGERLER: TeklifRedKategori[] = [
  "USTMAKAM_ONAY",
  "DUSUNUYOR",
  "PARA_BEKLIYOR",
  "FIYAT_YUKSEK",
  "BASKA_FIRMA",
  "ULASILAMIYOR",
  "DIGER",
];

const BELGE_TIPI_DEGERLER = ["TEKLIF", "TALIMAT", "SOZLESME"] as const;

const baseSchema = z.object({
  firmaId: z.string().cuid("Firma seçilmedi"),
  gorusmeId: z.string().cuid().optional(),
  belgeTipi: z.enum(BELGE_TIPI_DEGERLER),
  baslik: z.string().min(3, "Başlık en az 3 karakter").max(160),
  icerik: z.string().min(10, "İçerik en az 10 karakter").max(20000),
  tutar: z
    .string()
    .min(1, "Tutar zorunlu")
    .transform((v) => Number(v.replace(",", ".")))
    .refine((v) => Number.isFinite(v) && v >= 0, {
      message: "Geçerli bir tutar girin",
    }),
  paraBirimi: z.string().default("TRY"),
  indirimYuzde: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v.replace(",", ".")) : undefined))
    .refine((v) => v === undefined || (Number.isFinite(v) && v >= 0 && v <= 100), {
      message: "İndirim %0-100 arasında olmalı",
    }),
  kabulOlasilik: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 50))
    .refine((v) => Number.isFinite(v) && v >= 0 && v <= 100, {
      message: "Olasılık %0-100 arasında olmalı",
    }),
  gecerlilikTarih: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
});

const teklifCreateSchema = baseSchema;
const teklifUpdateSchema = baseSchema.extend({ id: z.string().cuid() });

export async function teklifOlusturAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAuth();
  if (user.role === UserRole.GOZLEMCI) {
    return { ok: false, error: "Bu işlem için yetkiniz yok" };
  }

  const { data, state } = parseFormData(teklifCreateSchema, formData);
  if (state) return state;

  const firma = await prisma.firma.findUnique({
    where: { id: data!.firmaId },
    select: { id: true },
  });
  if (!firma) {
    return {
      ok: false,
      error: "Seçili firma bulunamadı",
      fieldErrors: { firmaId: "Geçersiz firma" },
    };
  }

  if (data!.gorusmeId) {
    const g = await prisma.gorusme.findUnique({
      where: { id: data!.gorusmeId },
      select: { firmaId: true },
    });
    if (!g || g.firmaId !== data!.firmaId) {
      return {
        ok: false,
        error: "Görüşme firmayla eşleşmiyor",
      };
    }
  }

  const onayYuzde = await indirimOnayYuzdesi();
  const indirimVar = !!data!.indirimYuzde && data!.indirimYuzde > 0;
  const onayGerek = indirimVar && data!.indirimYuzde! >= onayYuzde;
  const netTutar = netTutarHesapla(data!.tutar, data!.indirimYuzde);

  const belgeNo = await belgeNoUret(data!.belgeTipi as BelgeTipi);

  const yeni = await prisma.teklif.create({
    data: {
      belgeNo,
      belgeTipi: data!.belgeTipi as BelgeTipi,
      firmaId: data!.firmaId,
      gorusmeId: data!.gorusmeId,
      sorumluId: user.id,
      hazirlayanId: user.id,
      baslik: data!.baslik.trim(),
      icerik: data!.icerik.trim(),
      tutar: data!.tutar,
      paraBirimi: data!.paraBirimi || "TRY",
      indirimYuzde: data!.indirimYuzde,
      netTutar,
      kabulOlasilik: data!.kabulOlasilik ?? 50,
      gecerlilikTarih: data!.gecerlilikTarih,
      durum: onayGerek ? BelgeDurum.ONAY_BEKLIYOR : BelgeDurum.TASLAK,
    },
    select: { id: true, belgeNo: true, baslik: true },
  });

  if (onayGerek) {
    const yoneticiler = await prisma.user.findMany({
      where: { role: UserRole.YONETICI, isActive: true },
      select: { id: true },
    });
    if (yoneticiler.length > 0) {
      await prisma.bildirim.createMany({
        data: yoneticiler.map((y) => ({
          userId: y.id,
          tip: BildirimTipi.INDIRIM_ONAY_GEREKLI,
          baslik: "İndirim onayı bekleniyor",
          icerik: `${yeni.belgeNo} — ${yeni.baslik} — %${data!.indirimYuzde} indirim`,
          link: `/teklifler/${yeni.id}`,
        })),
      });
    }
  }

  revalidatePath("/teklifler");
  revalidatePath(`/firmalar/${data!.firmaId}`);
  if (data!.gorusmeId) revalidatePath(`/gorusmeler/${data!.gorusmeId}`);
  redirect(`/teklifler/${yeni.id}`);
}

export async function teklifGuncelleAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAuth();
  if (user.role === UserRole.GOZLEMCI) {
    return { ok: false, error: "Bu işlem için yetkiniz yok" };
  }

  const { data, state } = parseFormData(teklifUpdateSchema, formData);
  if (state) return state;

  const mevcut = await prisma.teklif.findUnique({
    where: { id: data!.id },
    select: {
      durum: true,
      sorumluId: true,
      indirimYuzde: true,
      indirimOnayId: true,
    },
  });
  if (!mevcut) return { ok: false, error: "Teklif bulunamadı" };
  if (
    mevcut.durum === BelgeDurum.KABUL ||
    mevcut.durum === BelgeDurum.REDDEDILDI ||
    mevcut.durum === BelgeDurum.IPTAL
  ) {
    return { ok: false, error: "Karara bağlanmış teklif düzenlenemez" };
  }
  if (user.role !== UserRole.YONETICI && mevcut.sorumluId !== user.id) {
    return { ok: false, error: "Sadece sorumlu veya yönetici düzenleyebilir" };
  }

  const onayYuzde = await indirimOnayYuzdesi();
  const indirimDegisti =
    (Number(mevcut.indirimYuzde ?? 0) || 0) !== (data!.indirimYuzde ?? 0);
  const indirimVar = !!data!.indirimYuzde && data!.indirimYuzde > 0;
  const onayGerek = indirimVar && data!.indirimYuzde! >= onayYuzde;
  const netTutar = netTutarHesapla(data!.tutar, data!.indirimYuzde);

  let yeniDurum = mevcut.durum;
  let indirimOnayId = mevcut.indirimOnayId;
  let indirimOnayTar: Date | null | undefined = undefined;

  if (indirimDegisti) {
    indirimOnayId = null;
    indirimOnayTar = null;
    if (mevcut.durum === BelgeDurum.TASLAK || mevcut.durum === BelgeDurum.ONAY_BEKLIYOR) {
      yeniDurum = onayGerek ? BelgeDurum.ONAY_BEKLIYOR : BelgeDurum.TASLAK;
    }
  }

  await prisma.teklif.update({
    where: { id: data!.id },
    data: {
      belgeTipi: data!.belgeTipi as BelgeTipi,
      baslik: data!.baslik.trim(),
      icerik: data!.icerik.trim(),
      tutar: data!.tutar,
      paraBirimi: data!.paraBirimi || "TRY",
      indirimYuzde: data!.indirimYuzde,
      netTutar,
      kabulOlasilik: data!.kabulOlasilik ?? 50,
      gecerlilikTarih: data!.gecerlilikTarih,
      durum: yeniDurum,
      indirimOnayId,
      ...(indirimOnayTar !== undefined ? { indirimOnayTar } : {}),
    },
  });

  revalidatePath("/teklifler");
  revalidatePath(`/teklifler/${data!.id}`);
  return { ok: true };
}

export async function teklifGonderAction(formData: FormData) {
  const user = await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const teklif = await prisma.teklif.findUnique({
    where: { id },
    select: { durum: true, sorumluId: true, firmaId: true },
  });
  if (!teklif) return;
  if (teklif.durum !== BelgeDurum.TASLAK) return;
  if (user.role !== UserRole.YONETICI && teklif.sorumluId !== user.id) return;

  await prisma.teklif.update({
    where: { id },
    data: {
      durum: BelgeDurum.GONDERILDI,
      gonderilmeTar: new Date(),
    },
  });

  revalidatePath("/teklifler");
  revalidatePath(`/teklifler/${id}`);
  revalidatePath(`/firmalar/${teklif.firmaId}`);
}

export async function teklifIndirimOnayAction(formData: FormData) {
  const yonetici = await requireRole(UserRole.YONETICI);
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const teklif = await prisma.teklif.findUnique({
    where: { id },
    select: { durum: true, sorumluId: true, belgeNo: true, baslik: true },
  });
  if (!teklif || teklif.durum !== BelgeDurum.ONAY_BEKLIYOR) return;

  await prisma.teklif.update({
    where: { id },
    data: {
      durum: BelgeDurum.TASLAK,
      indirimOnayId: yonetici.id,
      indirimOnayTar: new Date(),
    },
  });

  await prisma.bildirim.create({
    data: {
      userId: teklif.sorumluId,
      tip: BildirimTipi.INDIRIM_ONAY_GEREKLI,
      baslik: "İndirim onaylandı",
      icerik: `${teklif.belgeNo} için talep ettiğiniz indirim onaylandı`,
      link: `/teklifler/${id}`,
    },
  });

  revalidatePath("/teklifler");
  revalidatePath(`/teklifler/${id}`);
}

export async function teklifKabulAction(formData: FormData) {
  const user = await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (!id || user.role === UserRole.GOZLEMCI) return;

  const teklif = await prisma.teklif.findUnique({
    where: { id },
    select: { durum: true, sorumluId: true, firmaId: true },
  });
  if (!teklif) return;
  if (teklif.durum !== BelgeDurum.GONDERILDI && teklif.durum !== BelgeDurum.BEKLEMEDE) {
    return;
  }
  if (user.role !== UserRole.YONETICI && teklif.sorumluId !== user.id) return;

  await prisma.teklif.update({
    where: { id },
    data: {
      durum: BelgeDurum.KABUL,
      kabulTar: new Date(),
      kapatanId: user.id,
    },
  });

  revalidatePath("/teklifler");
  revalidatePath(`/teklifler/${id}`);
  revalidatePath(`/firmalar/${teklif.firmaId}`);
}

export async function teklifRedAction(formData: FormData) {
  const user = await requireAuth();
  const id = String(formData.get("id") ?? "");
  const redKategorisiRaw = String(formData.get("redKategorisi") ?? "");
  const redNedeni = String(formData.get("redNedeni") ?? "").trim();
  if (!id || user.role === UserRole.GOZLEMCI) return;

  const redKategorisi = RED_KATEGORI_DEGERLER.includes(
    redKategorisiRaw as TeklifRedKategori,
  )
    ? (redKategorisiRaw as TeklifRedKategori)
    : null;
  if (!redKategorisi) return;
  // "DIGER" seçilirse serbest açıklama zorunlu olsun; diğer kategorilerde opsiyonel.
  if (redKategorisi === "DIGER" && redNedeni.length < 5) return;

  const teklif = await prisma.teklif.findUnique({
    where: { id },
    select: { durum: true, sorumluId: true, firmaId: true },
  });
  if (!teklif) return;
  if (teklif.durum !== BelgeDurum.GONDERILDI && teklif.durum !== BelgeDurum.BEKLEMEDE) {
    return;
  }
  if (user.role !== UserRole.YONETICI && teklif.sorumluId !== user.id) return;

  await prisma.teklif.update({
    where: { id },
    data: {
      durum: BelgeDurum.REDDEDILDI,
      redKategorisi,
      redNedeni: redNedeni || null,
      kapatanId: user.id,
    },
  });

  revalidatePath("/teklifler");
  revalidatePath(`/teklifler/${id}`);
  revalidatePath(`/firmalar/${teklif.firmaId}`);
}

/**
 * Müşteri parayı yatırdığında işaretlenir. Eğer henüz Operasyon kaydı
 * oluşmadıysa, dosya sorumlusu = teklif sorumlusu olacak şekilde otomatik
 * Operasyon oluşturulur — funnel artık operasyon adımına geçer.
 *
 * Yetki: yönetici veya teklif sorumlusu.
 */
export async function teklifOdemeAlindiAction(formData: FormData) {
  const user = await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (!id || user.role === UserRole.GOZLEMCI) return;

  const teklif = await prisma.teklif.findUnique({
    where: { id },
    select: {
      id: true,
      durum: true,
      sorumluId: true,
      firmaId: true,
      odemeAlindiTar: true,
      belgeTipi: true,
      belgeNo: true,
      baslik: true,
      operasyon: { select: { id: true } },
    },
  });
  if (!teklif) return;
  if (teklif.durum !== BelgeDurum.KABUL) return;
  if (teklif.odemeAlindiTar) return; // zaten işaretli
  if (user.role !== UserRole.YONETICI && teklif.sorumluId !== user.id) return;

  // İki işlem tek transaction'da: ödeme bilgisini yaz + operasyon yoksa oluştur.
  const sonuc = await prisma.$transaction(async (tx) => {
    await tx.teklif.update({
      where: { id },
      data: {
        odemeAlindiTar: new Date(),
        odemeAlanId: user.id,
      },
    });

    if (teklif.operasyon) return { operasyonId: teklif.operasyon.id, yeni: false };

    const operasyonBelgeNo = await belgeNoUret("OPERASYON", tx);

    const operasyon = await tx.operasyon.create({
      data: {
        belgeNo: operasyonBelgeNo,
        teklifId: teklif.id,
        sorumluId: teklif.sorumluId, // default: teklifi hazırlayan/sorumlu olan
        kategori: OperasyonKategori.DIGER,
        durum: OperasyonDurum.BEKLIYOR,
      },
      select: { id: true },
    });

    // Sorumlu kendinden farklıysa bildirim gönder (kendi kendine bildirim atmayalım).
    if (teklif.sorumluId !== user.id) {
      await tx.bildirim.create({
        data: {
          userId: teklif.sorumluId,
          tip: BildirimTipi.HATIRLATMA,
          baslik: "Yeni operasyon: dosya sana atandı",
          icerik: `${teklif.belgeNo} — ${teklif.baslik} parası alındı, operasyona geçti.`,
          link: `/operasyonlar/${operasyon.id}`,
        },
      });
    }

    return { operasyonId: operasyon.id, yeni: true };
  });

  revalidatePath("/");
  revalidatePath("/teklifler");
  revalidatePath(`/teklifler/${id}`);
  revalidatePath(`/firmalar/${teklif.firmaId}`);
  revalidatePath("/operasyonlar");
  if (sonuc?.operasyonId) revalidatePath(`/operasyonlar/${sonuc.operasyonId}`);
}

export async function teklifIptalAction(formData: FormData) {
  const user = await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const teklif = await prisma.teklif.findUnique({
    where: { id },
    select: { durum: true, sorumluId: true },
  });
  if (!teklif) return;
  if (teklif.durum === BelgeDurum.KABUL || teklif.durum === BelgeDurum.REDDEDILDI) {
    return;
  }
  if (user.role !== UserRole.YONETICI && teklif.sorumluId !== user.id) return;

  await prisma.teklif.update({
    where: { id },
    data: { durum: BelgeDurum.IPTAL },
  });

  revalidatePath("/teklifler");
  revalidatePath(`/teklifler/${id}`);
}

/**
 * Yönetici-only silme. Bağlı operasyon varsa silmez (UI revalidate eder).
 * Bağlı notlar, devirler ve bildirimler korunmaz — cascade için Prisma cascade tanımı yoksa
 * elle temizlenir.
 */
export async function teklifSilAction(formData: FormData) {
  await requireRole(UserRole.YONETICI);
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const bagliOperasyon = await prisma.operasyon.count({ where: { teklifId: id } });
  if (bagliOperasyon > 0) return;

  const t = await prisma.teklif.findUnique({
    where: { id },
    select: { firmaId: true },
  });
  if (!t) return;

  // Bağlı not ve devirleri sil (FK cascade onDelete kuralları zaten Cascade)
  await prisma.teklif.delete({ where: { id } });

  revalidatePath("/teklifler");
  revalidatePath(`/firmalar/${t.firmaId}`);
  redirect("/teklifler");
}
