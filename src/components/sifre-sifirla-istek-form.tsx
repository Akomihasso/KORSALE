"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";

import {
  sifreSifirlamaIstekAction,
  type SifreSifirlamaIstekState,
} from "@/lib/actions/sifre-sifirla-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initialState: SifreSifirlamaIstekState = { ok: false };

export function SifreSifirlaIstekForm() {
  const [state, formAction, pending] = useActionState(
    sifreSifirlamaIstekAction,
    initialState,
  );

  if (state.ok) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription className="flex items-start gap-2">
            <MailCheck className="mt-0.5 size-4" />
            <span>
              E-postanızı kontrol edin — girdiğiniz adres sistemimizde kayıtlıysa
              size bir şifre sıfırlama bağlantısı gönderdik. Bağlantı 60 dakika
              geçerlidir. Gelmediğini düşünüyorsanız spam kutunuza bakın veya
              yöneticinizle iletişime geçin.
            </span>
          </AlertDescription>
        </Alert>
        <Link
          href="/giris"
          className="block text-center text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          Giriş ekranına dön
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-posta</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="ornek@kordinat.com"
        />
      </div>

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending && <Loader2 className="size-4 animate-spin" />}
        {pending ? "Gönderiliyor..." : "Sıfırlama bağlantısı gönder"}
      </Button>

      <Link
        href="/giris"
        className="block text-center text-sm text-muted-foreground hover:text-foreground hover:underline"
      >
        Giriş ekranına dön
      </Link>
    </form>
  );
}
