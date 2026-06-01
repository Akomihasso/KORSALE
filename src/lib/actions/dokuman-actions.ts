"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { dokumanYukle, dokumanSil, urldenPath } from "@/lib/supabase-storage";
import { DokumanKategori, UserRole } from "@prisma/client";
import { parseFormData, type ActionState } from "./_shared";

const KATEGORI_DEGERLER = [
  "YONETMELIK_TALIMAT",
  "SISTEM_TARIF",
  "AKIS_SEMASI",
  "YAZISMA_STANDART",
  "TEKLIF_SABLON",
  "TALIMAT_SABLON",
  "SOZLESME_STANDART",
] as const;

const MAX_DOSYA_BYTE = 20 * 1024 * 1024; // 20 MB

const dokumanSchema = z.object({
  kategori: z.enum(KATEGORI_DEGERLER),
  kod: z.string().min(2, "Kod en az 2 karakter").max(60),
  revizyon: z.string().min(1).max(8).default("R0"),
  baslik: z.string().min(2).max(200),
});

export async function dokumanYukleAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const yonetici = await requireRole(UserRole.YONETICI);

  const dosya = formData.get("dosya");
  if (!(dosya instanceof File) || dosya.size === 0) {
    return { ok: false, error: "Dosya seçilmedi" };
  }
  if (dosya.size > MAX_DOSYA_BYTE) {
    return { ok: false, error: "Dosya çok büyük (en fazla 20 MB)" };
  }

  const { data, state } = parseFormData(dokumanSchema, formData);
  if (state) return state;

  const dosyaTipi = (dosya.name.split(".").pop() ?? "").toLowerCase().slice(0, 12);

  let yuklemeSonuc: { url: string; path: string };
  try {
    yuklemeSonuc = await dokumanYukle(dosya, data!.kategori);
  } catch (e) {
    const mesaj = e instanceof Error ? e.message : "Yükleme başarısız";
    return { ok: false, error: mesaj };
  }

  await prisma.dokuman.create({
    data: {
      kategori: data!.kategori as DokumanKategori,
      kod: data!.kod.trim().toUpperCase(),
      revizyon: data!.revizyon.trim().toUpperCase(),
      baslik: data!.baslik.trim(),
      dosyaUrl: yuklemeSonuc.url,
      dosyaTipi,
      dosyaBoyut: dosya.size,
      yukleyenId: yonetici.id,
    },
  });

  revalidatePath("/korsistem");
  revalidatePath(`/korsistem/${data!.kategori.toLowerCase()}`);
  return { ok: true };
}

export async function dokumanSilAction(formData: FormData) {
  await requireRole(UserRole.YONETICI);
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const dok = await prisma.dokuman.findUnique({
    where: { id },
    select: { dosyaUrl: true, kategori: true },
  });
  if (!dok) return;

  const path = urldenPath(dok.dosyaUrl);
  if (path) {
    try {
      await dokumanSil(path);
    } catch {
      // Storage'da yoksa devam et — DB'den silmeyi engelleme
    }
  }

  await prisma.dokuman.delete({ where: { id } });

  revalidatePath("/korsistem");
  revalidatePath(`/korsistem/${dok.kategori.toLowerCase()}`);
}
