"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { parseFormData, type ActionState } from "./_shared";

const sifreDegistirSchema = z
  .object({
    mevcutSifre: z.string().min(1, "Mevcut şifrenizi girin"),
    yeniSifre: z.string().min(8, "Yeni şifre en az 8 karakter olmalı"),
    yeniSifreTekrar: z.string().min(8, "Şifre tekrarı en az 8 karakter olmalı"),
  })
  .refine((d) => d.yeniSifre === d.yeniSifreTekrar, {
    message: "Yeni şifre ile tekrarı uyuşmuyor",
    path: ["yeniSifreTekrar"],
  })
  .refine((d) => d.mevcutSifre !== d.yeniSifre, {
    message: "Yeni şifre mevcut şifre ile aynı olamaz",
    path: ["yeniSifre"],
  });

export async function sifreDegistirAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAuth();

  const { data, state } = parseFormData(sifreDegistirSchema, formData);
  if (state) return state;

  const kayit = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!kayit?.passwordHash) {
    return { ok: false, error: "Kullanıcı şifresi tanımlı değil" };
  }

  const dogruMu = await bcrypt.compare(data!.mevcutSifre, kayit.passwordHash);
  if (!dogruMu) {
    return {
      ok: false,
      error: "Mevcut şifre hatalı",
      fieldErrors: { mevcutSifre: "Şifre hatalı" },
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(data!.yeniSifre, 12) },
  });

  revalidatePath("/profil");
  return { ok: true };
}

const profilGuncelleSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter olmalı").max(80),
});

export async function profilGuncelleAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAuth();
  const { data, state } = parseFormData(profilGuncelleSchema, formData);
  if (state) return state;

  await prisma.user.update({
    where: { id: user.id },
    data: { name: data!.name.trim() },
  });

  revalidatePath("/profil");
  revalidatePath("/", "layout");
  return { ok: true };
}
