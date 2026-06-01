"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { davetMailiGonder } from "@/lib/mail";
import { UserRole } from "@prisma/client";

const GIRIS_URL = "https://korsale.tr/giris";

const ROL_DEGERLERI = ["YONETICI", "SATIS", "OPERASYON", "GOZLEMCI"] as const;

// Karışabilen karakterler (0/O, 1/l/I) çıkarıldı — kullanıcı maille gelen şifreyi elle yazacak
const SIFRE_ALFABE = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function gecicSifreUret(uzunluk = 12) {
  let s = "";
  for (let i = 0; i < uzunluk; i++) {
    s += SIFRE_ALFABE[randomInt(SIFRE_ALFABE.length)];
  }
  return s;
}

const kullaniciCreateSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  name: z.string().min(2, "Ad en az 2 karakter olmalı").max(80),
  role: z.enum(ROL_DEGERLERI),
});

const kullaniciUpdateSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(2).max(80),
  role: z.enum(ROL_DEGERLERI),
  isActive: z.boolean(),
  password: z.string().min(8).optional().or(z.literal("")),
});

export type ActionState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  mailGonderildi?: boolean;
  mailHedef?: string;
  mailHata?: string;
};

function parseFormData<T extends z.ZodTypeAny>(
  schema: T,
  formData: FormData,
): { data?: z.infer<T>; state?: ActionState } {
  const raw = Object.fromEntries(formData.entries()) as Record<string, unknown>;

  // isActive checkbox dönüşümü
  if ("isActive" in raw) {
    raw.isActive = raw.isActive === "on" || raw.isActive === "true";
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      state: {
        ok: false,
        error: "Form bilgilerini kontrol edin",
        fieldErrors,
      },
    };
  }
  return { data: parsed.data };
}

export async function kullaniciOlusturAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(UserRole.YONETICI);

  const { data, state } = parseFormData(kullaniciCreateSchema, formData);
  if (state) return state;

  const mevcut = await prisma.user.findUnique({
    where: { email: data!.email },
    select: { id: true },
  });
  if (mevcut) {
    return {
      ok: false,
      error: "Bu e-posta zaten kayıtlı",
      fieldErrors: { email: "Bu e-posta zaten kayıtlı" },
    };
  }

  const gecicSifre = gecicSifreUret(12);

  const yeniKullanici = await prisma.user.create({
    data: {
      email: data!.email.toLowerCase(),
      name: data!.name.trim(),
      role: data!.role,
      passwordHash: await bcrypt.hash(gecicSifre, 12),
    },
  });

  const mailSonuc = await davetMailiGonder({
    ad: yeniKullanici.name ?? data!.name.trim(),
    email: yeniKullanici.email,
    gecicSifre,
    girisUrl: GIRIS_URL,
  });

  if (!mailSonuc.ok) {
    console.error("[kullaniciOlustur] davet maili gönderilemedi:", mailSonuc.error);
  }

  revalidatePath("/ekip-uyeleri");
  return {
    ok: true,
    mailGonderildi: mailSonuc.ok,
    mailHedef: yeniKullanici.email,
    mailHata: mailSonuc.ok ? undefined : mailSonuc.error,
  };
}

export async function kullaniciGuncelleAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(UserRole.YONETICI);

  const { data, state } = parseFormData(kullaniciUpdateSchema, formData);
  if (state) return state;

  const guncellenecek: {
    name: string;
    role: UserRole;
    isActive: boolean;
    passwordHash?: string;
  } = {
    name: data!.name.trim(),
    role: data!.role,
    isActive: data!.isActive,
  };

  if (data!.password && data!.password.length >= 8) {
    guncellenecek.passwordHash = await bcrypt.hash(data!.password, 12);
  }

  await prisma.user.update({
    where: { id: data!.id },
    data: guncellenecek,
  });

  revalidatePath("/ekip-uyeleri");
  return { ok: true };
}

export async function kullaniciAktiflikAction(formData: FormData) {
  await requireRole(UserRole.YONETICI);
  const id = String(formData.get("id") ?? "");
  const yeniDurum = formData.get("isActive") === "true";

  if (!id) return;

  await prisma.user.update({
    where: { id },
    data: { isActive: yeniDurum },
  });

  revalidatePath("/ekip-uyeleri");
}
