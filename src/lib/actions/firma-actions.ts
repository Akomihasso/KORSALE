"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { parseFormData, type ActionState } from "./_shared";

// "Referans", "Web", "Fuar", "Soğuk arama", "Diğer" gibi serbest metin de olabilir
const KAYNAK_OPSIYONLAR = [
  "Referans",
  "Web",
  "Fuar",
  "Soğuk arama",
  "Sosyal medya",
  "Diğer",
] as const;

export const KAYNAKLAR = KAYNAK_OPSIYONLAR;

const firmaCreateSchema = z.object({
  ad: z.string().min(2, "Firma adı en az 2 karakter olmalı").max(160),
  vergiNo: z
    .string()
    .regex(/^\d{10,11}$/, "Vergi/TC no 10 veya 11 haneli rakam olmalı")
    .optional(),
  sektor: z.string().max(80).optional(),
  sehir: z.string().max(60).optional(),
  telefon: z.string().max(40).optional(),
  email: z.string().email("Geçerli e-posta girin").max(120).optional(),
  web: z.string().url("Geçerli URL girin (https://...)").max(200).optional(),
  kaynak: z.string().max(60).optional(),
  notlar: z.string().max(2000).optional(),
});

const firmaUpdateSchema = firmaCreateSchema.extend({
  id: z.string().cuid(),
});

async function vergiNoTekrarVarMi(vergiNo: string | undefined, excludeId?: string) {
  if (!vergiNo) return false;
  const mevcut = await prisma.firma.findFirst({
    where: { vergiNo, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    select: { id: true },
  });
  return !!mevcut;
}

export async function firmaOlusturAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAuth();
  const { data, state } = parseFormData(firmaCreateSchema, formData);
  if (state) return state;

  if (await vergiNoTekrarVarMi(data!.vergiNo)) {
    return {
      ok: false,
      error: "Bu vergi/TC no zaten kayıtlı",
      fieldErrors: { vergiNo: "Aynı no ile başka firma var" },
    };
  }

  const yeni = await prisma.firma.create({
    data: {
      ad: data!.ad.trim(),
      vergiNo: data!.vergiNo,
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

  if (await vergiNoTekrarVarMi(data!.vergiNo, data!.id)) {
    return {
      ok: false,
      error: "Bu vergi/TC no başka firmada zaten kayıtlı",
      fieldErrors: { vergiNo: "Aynı no ile başka firma var" },
    };
  }

  await prisma.firma.update({
    where: { id: data!.id },
    data: {
      ad: data!.ad.trim(),
      vergiNo: data!.vergiNo,
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
