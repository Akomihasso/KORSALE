"use server";

import crypto from "crypto";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { sifreSifirlamaMailiGonder } from "@/lib/mail";
import type { ActionState } from "./_shared";

const TOKEN_GECERLILIK_DAKIKA = 60;

function tokenUret() {
  const raw = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

function tokenHash(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function panelUrl() {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000";
  return url.replace(/\/$/, "");
}

const istekSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
});

export type SifreSifirlamaIstekState = ActionState;

/**
 * Şifre sıfırlama linki istek. Güvenlik gereği hem geçerli hem geçersiz
 * e-postalar için aynı başarılı mesajı döner ("kayıtlıysa mail gönderildi").
 */
export async function sifreSifirlamaIstekAction(
  _prev: SifreSifirlamaIstekState,
  formData: FormData,
): Promise<SifreSifirlamaIstekState> {
  const raw = { email: String(formData.get("email") ?? "") };
  const parsed = istekSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Geçersiz e-posta",
    };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const kullanici = await prisma.user.findFirst({
    where: { email, isActive: true },
    select: { id: true, name: true, email: true },
  });

  // Aktif kullanıcı varsa token üret ve mail gönder — yoksa sessizce başarılı dön
  if (kullanici) {
    const { raw: rawToken, hash } = tokenUret();
    const expiresAt = new Date(
      Date.now() + TOKEN_GECERLILIK_DAKIKA * 60 * 1000,
    );

    await prisma.sifreSifirlamaToken.create({
      data: {
        userId: kullanici.id,
        tokenHash: hash,
        expiresAt,
      },
    });

    const link = `${panelUrl()}/sifre-sifirla/${rawToken}`;
    const sonuc = await sifreSifirlamaMailiGonder({
      ad: kullanici.name,
      email: kullanici.email,
      link,
      gecerlilikDakika: TOKEN_GECERLILIK_DAKIKA,
    });

    if (!sonuc.ok) {
      // Mail gönderilemediyse admin loglarına düşsün ama kullanıcıya nötr cevap ver
      console.error("Şifre sıfırlama maili gönderilemedi:", sonuc.error);
    }
  }

  return { ok: true };
}

const yeniSifreSchema = z
  .object({
    token: z.string().min(20, "Geçersiz sıfırlama bağlantısı"),
    yeniSifre: z.string().min(8, "Yeni şifre en az 8 karakter olmalı"),
    yeniSifreTekrar: z.string().min(8, "Şifre tekrarı en az 8 karakter olmalı"),
  })
  .refine((d) => d.yeniSifre === d.yeniSifreTekrar, {
    message: "Yeni şifre ile tekrarı uyuşmuyor",
    path: ["yeniSifreTekrar"],
  });

export type SifreSifirlamaTamamlaState = ActionState;

/**
 * Kullanıcı sıfırlama linki üzerinden yeni şifreyi belirler.
 * Token tek kullanımlıktır — usedAt işaretlenir.
 */
export async function sifreSifirlamaTamamlaAction(
  _prev: SifreSifirlamaTamamlaState,
  formData: FormData,
): Promise<SifreSifirlamaTamamlaState> {
  const raw = {
    token: String(formData.get("token") ?? ""),
    yeniSifre: String(formData.get("yeniSifre") ?? ""),
    yeniSifreTekrar: String(formData.get("yeniSifreTekrar") ?? ""),
  };

  const parsed = yeniSifreSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const iss of parsed.error.issues) {
      const key = iss.path.join(".") || "_";
      if (!fieldErrors[key]) fieldErrors[key] = iss.message;
    }
    return {
      ok: false,
      error: "Form bilgilerini kontrol edin",
      fieldErrors,
    };
  }

  const hash = tokenHash(parsed.data.token);
  const kayit = await prisma.sifreSifirlamaToken.findUnique({
    where: { tokenHash: hash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      usedAt: true,
    },
  });

  if (!kayit || kayit.usedAt || kayit.expiresAt.getTime() < Date.now()) {
    return {
      ok: false,
      error:
        "Bağlantı geçersiz veya süresi dolmuş. Lütfen yeni bir sıfırlama isteği başlatın.",
    };
  }

  const yeniHash = await bcrypt.hash(parsed.data.yeniSifre, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: kayit.userId },
      data: { passwordHash: yeniHash },
    }),
    prisma.sifreSifirlamaToken.update({
      where: { id: kayit.id },
      data: { usedAt: new Date() },
    }),
    // Aynı kullanıcının açık başka tokenlarını da geçersiz yap
    prisma.sifreSifirlamaToken.updateMany({
      where: {
        userId: kayit.userId,
        usedAt: null,
        id: { not: kayit.id },
      },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true };
}

/**
 * Sayfada göstermeden önce token'ın geçerli olup olmadığını kontrol eder.
 * Sunucuda çağrılır, sadece boolean döner.
 */
export async function tokenGecerliMi(rawToken: string): Promise<boolean> {
  if (!rawToken || rawToken.length < 20) return false;
  const hash = tokenHash(rawToken);
  const kayit = await prisma.sifreSifirlamaToken.findUnique({
    where: { tokenHash: hash },
    select: { expiresAt: true, usedAt: true },
  });
  if (!kayit) return false;
  if (kayit.usedAt) return false;
  if (kayit.expiresAt.getTime() < Date.now()) return false;
  return true;
}
