"use server";

import { z } from "zod";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
});

export type LoginState = {
  error?: string;
  fields?: { email?: string };
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Geçersiz giriş",
      fields: { email: raw.email },
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        error:
          err.type === "CredentialsSignin"
            ? "E-posta veya şifre hatalı"
            : "Giriş başarısız oldu",
        fields: { email: raw.email },
      };
    }
    // NEXT_REDIRECT vb. — yeniden fırlat
    throw err;
  }

  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/giris" });
}
