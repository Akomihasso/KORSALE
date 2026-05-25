import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { UserRole } from "@prisma/client";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  return user;
}

export async function requireRole(...roles: UserRole[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    redirect("/yetki-yok");
  }
  return user;
}

export const ROL_ETIKETLERI: Record<UserRole, string> = {
  YONETICI: "Yönetici",
  SATIS: "Satış",
  OPERASYON: "Operasyon",
  GOZLEMCI: "Gözlemci",
};
