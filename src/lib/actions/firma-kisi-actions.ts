"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { parseFormData, type ActionState } from "./_shared";

const kisiCreateSchema = z.object({
  firmaId: z.string().cuid(),
  ad: z.string().min(2, "Ad en az 2 karakter olmalı").max(120),
  unvan: z.string().max(80).optional(),
  telefon: z.string().max(40).optional(),
  email: z.string().email("Geçerli e-posta girin").max(120).optional(),
  birincil: z.boolean().default(false),
});

const kisiUpdateSchema = kisiCreateSchema.extend({
  id: z.string().cuid(),
});

export async function firmaKisiOlusturAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAuth();
  const { data, state } = parseFormData(kisiCreateSchema, formData, {
    booleanFields: ["birincil"],
  });
  if (state) return state;

  await prisma.$transaction(async (tx) => {
    if (data!.birincil) {
      await tx.firmaKisi.updateMany({
        where: { firmaId: data!.firmaId, birincil: true },
        data: { birincil: false },
      });
    }
    await tx.firmaKisi.create({
      data: {
        firmaId: data!.firmaId,
        ad: data!.ad.trim(),
        unvan: data!.unvan,
        telefon: data!.telefon,
        email: data!.email?.toLowerCase(),
        birincil: data!.birincil,
      },
    });
  });

  revalidatePath(`/firmalar/${data!.firmaId}`);
  return { ok: true };
}

export async function firmaKisiGuncelleAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAuth();
  const { data, state } = parseFormData(kisiUpdateSchema, formData, {
    booleanFields: ["birincil"],
  });
  if (state) return state;

  await prisma.$transaction(async (tx) => {
    if (data!.birincil) {
      await tx.firmaKisi.updateMany({
        where: {
          firmaId: data!.firmaId,
          birincil: true,
          NOT: { id: data!.id },
        },
        data: { birincil: false },
      });
    }
    await tx.firmaKisi.update({
      where: { id: data!.id },
      data: {
        ad: data!.ad.trim(),
        unvan: data!.unvan,
        telefon: data!.telefon,
        email: data!.email?.toLowerCase(),
        birincil: data!.birincil,
      },
    });
  });

  revalidatePath(`/firmalar/${data!.firmaId}`);
  return { ok: true };
}

export async function firmaKisiSilAction(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  const firmaId = String(formData.get("firmaId") ?? "");
  if (!id) return;

  await prisma.firmaKisi.delete({ where: { id } });
  if (firmaId) revalidatePath(`/firmalar/${firmaId}`);
}
