"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import {
  BildirimTipi,
  DevirDurum,
  DevirHedefTipi,
  UserRole,
} from "@prisma/client";
import { parseFormData, type ActionState } from "./_shared";

const HEDEF_TIPI_DEGERLER = ["GORUSME", "TEKLIF", "OPERASYON"] as const;

const devirCreateSchema = z.object({
  hedefTipi: z.enum(HEDEF_TIPI_DEGERLER),
  hedefId: z.string().cuid("Devredilecek kayıt belirsiz"),
  devralanId: z.string().cuid("Devralan seçilmedi"),
  devirNotu: z
    .string()
    .min(50, "Devir notu en az 50 karakter olmalı")
    .max(2000, "Devir notu en fazla 2000 karakter"),
});

/**
 * Sorumluyu hemen değiştirmez — devralan kabul edince değişir.
 * BEKLIYOR kaydı oluşur, devralana INTERNAL bildirim gider.
 */
export async function devirOlusturAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAuth();
  if (user.role === UserRole.GOZLEMCI) {
    return { ok: false, error: "Bu işlem için yetkiniz yok" };
  }

  const { data, state } = parseFormData(devirCreateSchema, formData);
  if (state) return state;

  if (data!.devralanId === user.id) {
    return {
      ok: false,
      error: "Kendinize devir yapamazsınız",
      fieldErrors: { devralanId: "Kendinize devir yapamazsınız" },
    };
  }

  const devralan = await prisma.user.findUnique({
    where: { id: data!.devralanId },
    select: { id: true, name: true, isActive: true, role: true },
  });
  if (!devralan || !devralan.isActive) {
    return {
      ok: false,
      error: "Devralan kullanıcı bulunamadı veya pasif",
      fieldErrors: { devralanId: "Geçersiz kullanıcı" },
    };
  }
  if (devralan.role === UserRole.GOZLEMCI) {
    return {
      ok: false,
      error: "Gözlemci rolüne devir yapılamaz",
      fieldErrors: { devralanId: "Gözlemciye devir yapılamaz" },
    };
  }

  // Hedef kaydı yetki kontrolü: sahip veya yönetici olmalı
  let hedefBaslik = "";
  let sorumluId: string | null = null;
  let yonlendirme = "/";

  switch (data!.hedefTipi) {
    case "GORUSME": {
      const g = await prisma.gorusme.findUnique({
        where: { id: data!.hedefId },
        select: { konu: true, sorumluId: true },
      });
      if (!g) return { ok: false, error: "Görüşme bulunamadı" };
      hedefBaslik = g.konu;
      sorumluId = g.sorumluId;
      yonlendirme = `/gorusmeler/${data!.hedefId}`;
      break;
    }
    case "TEKLIF": {
      const t = await prisma.teklif.findUnique({
        where: { id: data!.hedefId },
        select: { belgeNo: true, baslik: true, sorumluId: true },
      });
      if (!t) return { ok: false, error: "Teklif bulunamadı" };
      hedefBaslik = `${t.belgeNo} — ${t.baslik}`;
      sorumluId = t.sorumluId;
      yonlendirme = `/teklifler/${data!.hedefId}`;
      break;
    }
    case "OPERASYON": {
      const o = await prisma.operasyon.findUnique({
        where: { id: data!.hedefId },
        select: { teklif: { select: { belgeNo: true, baslik: true } }, sorumluId: true },
      });
      if (!o) return { ok: false, error: "Operasyon bulunamadı" };
      hedefBaslik = `${o.teklif.belgeNo} — ${o.teklif.baslik}`;
      sorumluId = o.sorumluId;
      yonlendirme = `/operasyonlar/${data!.hedefId}`;
      break;
    }
  }

  if (user.role !== UserRole.YONETICI && sorumluId !== user.id) {
    return { ok: false, error: "Bu kaydı yalnızca sorumlu veya yönetici devredebilir" };
  }

  // Aynı hedef + aynı devralan için bekleyen devir var mı?
  const mevcut = await prisma.gorevDevir.findFirst({
    where: {
      durum: DevirDurum.BEKLIYOR,
      devralanId: data!.devralanId,
      ...(data!.hedefTipi === "GORUSME" ? { gorusmeId: data!.hedefId } : {}),
      ...(data!.hedefTipi === "TEKLIF" ? { teklifId: data!.hedefId } : {}),
      ...(data!.hedefTipi === "OPERASYON" ? { operasyonId: data!.hedefId } : {}),
    },
    select: { id: true },
  });
  if (mevcut) {
    return { ok: false, error: "Bu kişiye bekleyen bir devir zaten var" };
  }

  const ZORLA = user.role === UserRole.YONETICI && sorumluId !== user.id;

  await prisma.$transaction(async (tx) => {
    await tx.gorevDevir.create({
      data: {
        hedefTipi: data!.hedefTipi as DevirHedefTipi,
        gorusmeId: data!.hedefTipi === "GORUSME" ? data!.hedefId : undefined,
        teklifId: data!.hedefTipi === "TEKLIF" ? data!.hedefId : undefined,
        operasyonId: data!.hedefTipi === "OPERASYON" ? data!.hedefId : undefined,
        devredenId: user.id,
        devralanId: data!.devralanId,
        devirNotu: data!.devirNotu.trim(),
        durum: ZORLA ? DevirDurum.ZORLA_DEVIR : DevirDurum.BEKLIYOR,
        cevapTar: ZORLA ? new Date() : undefined,
      },
    });

    if (ZORLA) {
      // Yönetici zorla devir — sorumluluk hemen değişir
      if (data!.hedefTipi === "GORUSME") {
        await tx.gorusme.update({
          where: { id: data!.hedefId },
          data: { sorumluId: data!.devralanId },
        });
      } else if (data!.hedefTipi === "TEKLIF") {
        await tx.teklif.update({
          where: { id: data!.hedefId },
          data: { sorumluId: data!.devralanId },
        });
      } else if (data!.hedefTipi === "OPERASYON") {
        await tx.operasyon.update({
          where: { id: data!.hedefId },
          data: { sorumluId: data!.devralanId },
        });
      }
    }

    // Devralana bildirim
    await tx.bildirim.create({
      data: {
        userId: data!.devralanId,
        tip: ZORLA ? BildirimTipi.DEVIR_KABUL : BildirimTipi.DEVIR_TALEBI,
        baslik: ZORLA ? "Zorla devir alındı" : "Devir talebi var",
        icerik: ZORLA
          ? `Yönetici ${user.name ?? ""} tarafından devredildi: ${hedefBaslik}`
          : `${user.name ?? ""}: ${hedefBaslik}`,
        link: yonlendirme,
      },
    });
  });

  revalidatePath("/is-devri");
  revalidatePath(yonlendirme);
  return { ok: true };
}

export async function devirKabulAction(formData: FormData) {
  const user = await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const devir = await prisma.gorevDevir.findUnique({
    where: { id },
    select: {
      devralanId: true,
      durum: true,
      hedefTipi: true,
      gorusmeId: true,
      teklifId: true,
      operasyonId: true,
      devredenId: true,
    },
  });
  if (!devir || devir.durum !== DevirDurum.BEKLIYOR) return;
  if (devir.devralanId !== user.id) return;

  await prisma.$transaction(async (tx) => {
    await tx.gorevDevir.update({
      where: { id },
      data: { durum: DevirDurum.KABUL, cevapTar: new Date() },
    });

    if (devir.hedefTipi === "GORUSME" && devir.gorusmeId) {
      await tx.gorusme.update({
        where: { id: devir.gorusmeId },
        data: { sorumluId: user.id },
      });
    } else if (devir.hedefTipi === "TEKLIF" && devir.teklifId) {
      await tx.teklif.update({
        where: { id: devir.teklifId },
        data: { sorumluId: user.id },
      });
    } else if (devir.hedefTipi === "OPERASYON" && devir.operasyonId) {
      await tx.operasyon.update({
        where: { id: devir.operasyonId },
        data: { sorumluId: user.id },
      });
    }

    await tx.bildirim.create({
      data: {
        userId: devir.devredenId,
        tip: BildirimTipi.DEVIR_KABUL,
        baslik: "Devriniz kabul edildi",
        icerik: `${user.name ?? ""} kabul etti`,
        link: devirHedefLink(devir),
      },
    });
  });

  revalidatePath("/is-devri");
  revalidatePath(devirHedefLink(devir));
}

export async function devirRedAction(formData: FormData) {
  const user = await requireAuth();
  const id = String(formData.get("id") ?? "");
  const redNedeni = String(formData.get("redNedeni") ?? "").trim();
  if (!id || redNedeni.length < 5) return;

  const devir = await prisma.gorevDevir.findUnique({
    where: { id },
    select: {
      devralanId: true,
      durum: true,
      hedefTipi: true,
      gorusmeId: true,
      teklifId: true,
      operasyonId: true,
      devredenId: true,
    },
  });
  if (!devir || devir.durum !== DevirDurum.BEKLIYOR) return;
  if (devir.devralanId !== user.id) return;

  await prisma.$transaction(async (tx) => {
    await tx.gorevDevir.update({
      where: { id },
      data: {
        durum: DevirDurum.REDDEDILDI,
        cevapTar: new Date(),
        redNedeni,
      },
    });

    await tx.bildirim.create({
      data: {
        userId: devir.devredenId,
        tip: BildirimTipi.DEVIR_RED,
        baslik: "Devriniz reddedildi",
        icerik: `${user.name ?? ""}: ${redNedeni}`,
        link: devirHedefLink(devir),
      },
    });
  });

  revalidatePath("/is-devri");
  revalidatePath(devirHedefLink(devir));
}

/**
 * Sprint 4'te devreye girecek — devreden 1 saat içinde geri alır.
 * Şimdiden actions tarafında var, sayfa Sprint 4'te bağlanacak.
 */
export async function devirGeriAlAction(formData: FormData) {
  const user = await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const devir = await prisma.gorevDevir.findUnique({
    where: { id },
    select: {
      devredenId: true,
      durum: true,
      createdAt: true,
      hedefTipi: true,
      gorusmeId: true,
      teklifId: true,
      operasyonId: true,
      devralanId: true,
    },
  });
  if (!devir || devir.durum !== DevirDurum.BEKLIYOR) return;
  if (devir.devredenId !== user.id) return;

  const birSaat = 60 * 60 * 1000;
  if (Date.now() - devir.createdAt.getTime() > birSaat) return;

  await prisma.$transaction(async (tx) => {
    await tx.gorevDevir.update({
      where: { id },
      data: { durum: DevirDurum.GERI_ALINDI, cevapTar: new Date() },
    });

    await tx.bildirim.create({
      data: {
        userId: devir.devralanId,
        tip: BildirimTipi.DEVIR_RED,
        baslik: "Devir geri alındı",
        icerik: "Devreden 1 saat içinde geri aldı",
        link: devirHedefLink(devir),
      },
    });
  });

  revalidatePath("/is-devri");
  revalidatePath(devirHedefLink(devir));
}

function devirHedefLink(devir: {
  hedefTipi: DevirHedefTipi;
  gorusmeId: string | null;
  teklifId: string | null;
  operasyonId: string | null;
}): string {
  switch (devir.hedefTipi) {
    case "GORUSME":
      return devir.gorusmeId ? `/gorusmeler/${devir.gorusmeId}` : "/gorusmeler";
    case "TEKLIF":
      return devir.teklifId ? `/teklifler/${devir.teklifId}` : "/teklifler";
    case "OPERASYON":
      return devir.operasyonId
        ? `/operasyonlar/${devir.operasyonId}`
        : "/operasyonlar";
  }
}
