"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import {
  BildirimTipi,
  OperasyonDurum,
  OperasyonKategori,
  UserRole,
} from "@prisma/client";

const KATEGORI_DEGERLER: OperasyonKategori[] = [
  "MARKA",
  "PATENT",
  "TASARIM",
  "DANISMANLIK",
  "DIGER",
];

/**
 * Operasyon dosyasının sorumlusunu değiştirir. Yetki: yönetici veya mevcut
 * sorumlu. (Resmi devir akışı için DevirDialog kullanılabilir; bu eylem
 * yöneticinin atama yapması için kısa yoldur.)
 */
export async function operasyonSorumluDegistirAction(formData: FormData) {
  const user = await requireAuth();
  const id = String(formData.get("id") ?? "");
  const yeniSorumluId = String(formData.get("sorumluId") ?? "");
  if (!id || !yeniSorumluId || user.role === UserRole.GOZLEMCI) return;

  const op = await prisma.operasyon.findUnique({
    where: { id },
    select: {
      sorumluId: true,
      teklif: { select: { belgeNo: true, baslik: true } },
    },
  });
  if (!op) return;
  if (user.role !== UserRole.YONETICI && op.sorumluId !== user.id) return;
  if (op.sorumluId === yeniSorumluId) return;

  const hedef = await prisma.user.findUnique({
    where: { id: yeniSorumluId },
    select: { isActive: true, role: true },
  });
  if (!hedef || !hedef.isActive || hedef.role === UserRole.GOZLEMCI) return;

  await prisma.$transaction([
    prisma.operasyon.update({
      where: { id },
      data: { sorumluId: yeniSorumluId },
    }),
    prisma.bildirim.create({
      data: {
        userId: yeniSorumluId,
        tip: BildirimTipi.HATIRLATMA,
        baslik: "Operasyon dosyası size atandı",
        icerik: `${op.teklif.belgeNo} — ${op.teklif.baslik}`,
        link: `/operasyonlar/${id}`,
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/operasyonlar");
  revalidatePath(`/operasyonlar/${id}`);
}

/**
 * Operasyon "son durum" serbest metin alanını günceller. Boş gönderilirse temizler.
 * Yetki: yönetici veya sorumlu.
 */
export async function operasyonSonDurumDegistirAction(formData: FormData) {
  const user = await requireAuth();
  const id = String(formData.get("id") ?? "");
  const sonDurumRaw = String(formData.get("sonDurum") ?? "").trim();
  if (!id || user.role === UserRole.GOZLEMCI) return;

  const op = await prisma.operasyon.findUnique({
    where: { id },
    select: { sorumluId: true },
  });
  if (!op) return;
  if (user.role !== UserRole.YONETICI && op.sorumluId !== user.id) return;

  await prisma.operasyon.update({
    where: { id },
    data: { sonDurum: sonDurumRaw.length > 0 ? sonDurumRaw.slice(0, 500) : null },
  });

  revalidatePath("/operasyonlar");
  revalidatePath(`/operasyonlar/${id}`);
}

/** Kategori (MARKA/PATENT/...) güncelle — yönetici veya sorumlu. */
export async function operasyonKategoriDegistirAction(formData: FormData) {
  const user = await requireAuth();
  const id = String(formData.get("id") ?? "");
  const kategoriRaw = String(formData.get("kategori") ?? "");
  if (!id || user.role === UserRole.GOZLEMCI) return;
  if (!KATEGORI_DEGERLER.includes(kategoriRaw as OperasyonKategori)) return;

  const op = await prisma.operasyon.findUnique({
    where: { id },
    select: { sorumluId: true },
  });
  if (!op) return;
  if (user.role !== UserRole.YONETICI && op.sorumluId !== user.id) return;

  await prisma.operasyon.update({
    where: { id },
    data: { kategori: kategoriRaw as OperasyonKategori },
  });

  revalidatePath("/operasyonlar");
  revalidatePath(`/operasyonlar/${id}`);
}

/**
 * Dosya sorumlusu işi bitirdiğinde işaretler. Durum TAMAMLANDI olur, bitisTar
 * yazılır, ilerleme %100'e çekilir.
 *
 * Yetki: yönetici veya operasyon sorumlusu.
 */
export async function operasyonBittiAction(formData: FormData) {
  const user = await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (!id || user.role === UserRole.GOZLEMCI) return;

  const op = await prisma.operasyon.findUnique({
    where: { id },
    select: { durum: true, sorumluId: true, teklif: { select: { firmaId: true } } },
  });
  if (!op) return;
  if (op.durum === OperasyonDurum.TAMAMLANDI || op.durum === OperasyonDurum.IPTAL) {
    return;
  }
  if (user.role !== UserRole.YONETICI && op.sorumluId !== user.id) return;

  await prisma.operasyon.update({
    where: { id },
    data: {
      durum: OperasyonDurum.TAMAMLANDI,
      bitisTar: new Date(),
      ilerlemeYuzde: 100,
    },
  });

  revalidatePath("/");
  revalidatePath("/operasyonlar");
  revalidatePath(`/operasyonlar/${id}`);
  revalidatePath(`/firmalar/${op.teklif.firmaId}`);
}

/**
 * Sorumlu operasyonu başlatır — durum BEKLIYOR'dan DEVAM_EDIYOR'a çekilir,
 * başlangıç tarihi yazılır.
 */
export async function operasyonBaslatAction(formData: FormData) {
  const user = await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (!id || user.role === UserRole.GOZLEMCI) return;

  const op = await prisma.operasyon.findUnique({
    where: { id },
    select: { durum: true, sorumluId: true, baslangicTar: true },
  });
  if (!op) return;
  if (op.durum !== OperasyonDurum.BEKLIYOR) return;
  if (user.role !== UserRole.YONETICI && op.sorumluId !== user.id) return;

  await prisma.operasyon.update({
    where: { id },
    data: {
      durum: OperasyonDurum.DEVAM_EDIYOR,
      baslangicTar: op.baslangicTar ?? new Date(),
    },
  });

  revalidatePath("/operasyonlar");
  revalidatePath(`/operasyonlar/${id}`);
}

/**
 * Yönetici-only silme. Cascade ile bağlı asama, not, devir silinir.
 */
export async function operasyonSilAction(formData: FormData) {
  const yonetici = await requireRole(UserRole.YONETICI);
  void yonetici;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const op = await prisma.operasyon.findUnique({
    where: { id },
    select: { teklif: { select: { firmaId: true } } },
  });
  if (!op) return;

  await prisma.operasyon.delete({ where: { id } });

  revalidatePath("/operasyonlar");
  revalidatePath(`/firmalar/${op.teklif.firmaId}`);
  redirect("/operasyonlar");
}
