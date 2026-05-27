"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

export async function bildirimOkuduAction(formData: FormData) {
  const user = await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.bildirim.updateMany({
    where: { id, userId: user.id },
    data: { okundu: true },
  });

  revalidatePath("/", "layout");
}

export async function bildirimlerTumunuOkuAction() {
  const user = await requireAuth();

  await prisma.bildirim.updateMany({
    where: { userId: user.id, okundu: false },
    data: { okundu: true },
  });

  revalidatePath("/", "layout");
}
