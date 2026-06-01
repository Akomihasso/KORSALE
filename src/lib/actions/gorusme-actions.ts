"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import {
  GorusmeDurum,
  GorusmeSonuc,
  GorusmeTipi,
  UserRole,
} from "@prisma/client";
import { parseFormData, type ActionState } from "./_shared";

const GORUSME_TIPI_DEGERLER = [
  "YUZ_YUZE",
  "TELEFON",
  "ONLINE",
  "EMAIL",
  "DIGER",
] as const;

const GORUSME_SONUC_DEGERLER = [
  "TEKLIF_ISTENDI",
  "BILGI_VERILDI",
  "ILGISIZ",
  "ERTELENDI",
  "REDDEDILDI",
  "TEKRAR_ARANACAK",
] as const;

const baseSchema = z.object({
  firmaId: z.string().cuid("Firma seçilmedi"),
  tarih: z
    .string()
    .min(1, "Tarih zorunlu")
    .transform((v) => new Date(v))
    .pipe(z.date()),
  tip: z.enum(GORUSME_TIPI_DEGERLER),
  yer: z.string().max(120).optional(),
  konu: z.string().min(3, "Konu en az 3 karakter olmalı").max(160),
  ozet: z.string().min(5, "Özet en az 5 karakter olmalı").max(4000),
  sonuc: z.enum(GORUSME_SONUC_DEGERLER),
  tahminiTutar: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v.replace(",", ".")) : undefined))
    .refine((v) => v === undefined || (Number.isFinite(v) && v >= 0), {
      message: "Geçerli bir tutar girin",
    }),
  hatirlatma: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
});

const gorusmeCreateSchema = baseSchema;
const gorusmeUpdateSchema = baseSchema.extend({ id: z.string().cuid() });

export async function gorusmeOlusturAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAuth();
  const { data, state } = parseFormData(gorusmeCreateSchema, formData);
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

  const yeni = await prisma.gorusme.create({
    data: {
      firmaId: data!.firmaId,
      sorumluId: user.id,
      ilkTemasId: user.id,
      tarih: data!.tarih,
      tip: data!.tip as GorusmeTipi,
      yer: data!.yer,
      konu: data!.konu.trim(),
      ozet: data!.ozet.trim(),
      sonuc: data!.sonuc as GorusmeSonuc,
      tahminiTutar: data!.tahminiTutar,
      hatirlatma: data!.hatirlatma,
    },
    select: { id: true },
  });

  revalidatePath("/gorusmeler");
  revalidatePath(`/firmalar/${data!.firmaId}`);
  redirect(`/gorusmeler/${yeni.id}`);
}

export async function gorusmeGuncelleAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAuth();
  const { data, state } = parseFormData(gorusmeUpdateSchema, formData);
  if (state) return state;

  await prisma.gorusme.update({
    where: { id: data!.id },
    data: {
      tarih: data!.tarih,
      tip: data!.tip as GorusmeTipi,
      yer: data!.yer,
      konu: data!.konu.trim(),
      ozet: data!.ozet.trim(),
      sonuc: data!.sonuc as GorusmeSonuc,
      tahminiTutar: data!.tahminiTutar,
      hatirlatma: data!.hatirlatma,
    },
  });

  revalidatePath("/gorusmeler");
  revalidatePath(`/gorusmeler/${data!.id}`);
  revalidatePath(`/firmalar/${data!.firmaId}`);
  return { ok: true };
}

export async function gorusmeDurumDegistirAction(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  const yeniDurum = String(formData.get("durum") ?? "");
  if (!id || (yeniDurum !== "ACIK" && yeniDurum !== "KAPALI")) return;

  const g = await prisma.gorusme.update({
    where: { id },
    data: { durum: yeniDurum as GorusmeDurum },
    select: { firmaId: true },
  });

  revalidatePath("/gorusmeler");
  revalidatePath(`/gorusmeler/${id}`);
  revalidatePath(`/firmalar/${g.firmaId}`);
}

/**
 * Yönetici-only silme. Bağlı teklif varsa silmez (return) — UI revalidate eder.
 */
export async function gorusmeSilAction(formData: FormData) {
  await requireRole(UserRole.YONETICI);
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const bagliTeklif = await prisma.teklif.count({ where: { gorusmeId: id } });
  if (bagliTeklif > 0) return;

  const g = await prisma.gorusme.findUnique({
    where: { id },
    select: { firmaId: true },
  });
  if (!g) return;

  await prisma.gorusme.delete({ where: { id } });

  revalidatePath("/gorusmeler");
  revalidatePath(`/firmalar/${g.firmaId}`);
  redirect("/gorusmeler");
}
