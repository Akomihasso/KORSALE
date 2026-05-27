"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { parseFormData, type ActionState } from "./_shared";

const firmaCreateSchema = z.object({
  ad: z.string().min(2, "Firma adı en az 2 karakter olmalı").max(160),
  sektor: z.string().max(80).optional(),
  sehir: z.string().max(60).optional(),
  telefon: z.string().max(40).optional(),
  email: z.string().email("Geçerli e-posta girin").max(120).optional(),
  web: z.string().url("Geçerli URL girin (https://...)").max(200).optional(),
  kaynak: z.string().max(60).optional(),
  notlar: z.string().max(2000).optional(),
});

const firmaHizliSchema = z.object({
  ad: z.string().min(2, "Firma adı en az 2 karakter olmalı").max(160),
  sektor: z.string().max(80).optional(),
  sehir: z.string().max(60).optional(),
});

export type FirmaHizliState = ActionState & {
  firma?: { id: string; ad: string; sektor: string | null; sehir: string | null };
};

const firmaUpdateSchema = firmaCreateSchema.extend({
  id: z.string().cuid(),
});

export async function firmaOlusturAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAuth();
  const { data, state } = parseFormData(firmaCreateSchema, formData);
  if (state) return state;

  const yeni = await prisma.firma.create({
    data: {
      ad: data!.ad.trim(),
      sektor: data!.sektor,
      sehir: data!.sehir,
      telefon: data!.telefon,
      email: data!.email?.toLowerCase(),
      web: data!.web,
      kaynak: data!.kaynak,
      notlar: data!.notlar,
    },
    select: { id: true },
  });

  revalidatePath("/firmalar");
  redirect(`/firmalar/${yeni.id}`);
}

export async function firmaGuncelleAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAuth();
  const { data, state } = parseFormData(firmaUpdateSchema, formData);
  if (state) return state;

  await prisma.firma.update({
    where: { id: data!.id },
    data: {
      ad: data!.ad.trim(),
      sektor: data!.sektor,
      sehir: data!.sehir,
      telefon: data!.telefon,
      email: data!.email?.toLowerCase(),
      web: data!.web,
      kaynak: data!.kaynak,
      notlar: data!.notlar,
    },
  });

  revalidatePath("/firmalar");
  revalidatePath(`/firmalar/${data!.id}`);
  return { ok: true };
}

/**
 * Görüşme/teklif formundan inline firma oluşturma — sadece ad zorunlu, redirect yok.
 * Yeni firma bilgisini state üzerinden döndürür.
 */
export async function firmaHizliOlusturAction(
  _prev: FirmaHizliState,
  formData: FormData,
): Promise<FirmaHizliState> {
  await requireAuth();
  const { data, state } = parseFormData(firmaHizliSchema, formData);
  if (state) return state;

  const yeni = await prisma.firma.create({
    data: {
      ad: data!.ad.trim(),
      sektor: data!.sektor,
      sehir: data!.sehir,
    },
    select: { id: true, ad: true, sektor: true, sehir: true },
  });

  revalidatePath("/firmalar");
  return { ok: true, firma: yeni };
}

export async function firmaSilAction(formData: FormData) {
  await requireRole(UserRole.YONETICI);
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Bağlı görüşme/teklif varsa silme — uyarı için cascade davranmıyoruz
  const bagliSayisi = await prisma.gorusme.count({ where: { firmaId: id } });
  if (bagliSayisi > 0) {
    // UI seviyesinde uyarı gerek — bu MVP için kullanıcı sayfayı yenilediğinde anlar
    return;
  }

  await prisma.firma.delete({ where: { id } });
  revalidatePath("/firmalar");
}
