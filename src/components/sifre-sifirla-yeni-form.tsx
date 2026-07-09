"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";

import {
  sifreSifirlamaTamamlaAction,
  type SifreSifirlamaTamamlaState,
} from "@/lib/actions/sifre-sifirla-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initialState: SifreSifirlamaTamamlaState = { ok: false };

type Props = { token: string };

export function SifreSifirlaYeniForm({ token }: Props) {
  const [state, formAction, pending] = useActionState(
    sifreSifirlamaTamamlaAction,
    initialState,
  );

  if (state.ok) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 size-4 text-emerald-600" />
            <span>
              Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.
            </span>
          </AlertDescription>
        </Alert>
        <Button className="w-full" render={<Link href="/giris" />}>
          Giriş ekranına git
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <div className="space-y-2">
        <Label htmlFor="yeniSifre">
          Yeni şifre <span className="text-destructive">*</span>
        </Label>
        <PasswordInput
          id="yeniSifre"
          name="yeniSifre"
          autoComplete="new-password"
          minLength={8}
          required
        />
        {state.fieldErrors?.yeniSifre && (
          <p className="text-xs text-destructive">{state.fieldErrors.yeniSifre}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="yeniSifreTekrar">
          Yeni şifre (tekrar) <span className="text-destructive">*</span>
        </Label>
        <PasswordInput
          id="yeniSifreTekrar"
          name="yeniSifreTekrar"
          autoComplete="new-password"
          minLength={8}
          required
        />
        {state.fieldErrors?.yeniSifreTekrar && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.yeniSifreTekrar}
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Şifreniz en az 8 karakter olmalı.
      </p>

      {state.error && !state.fieldErrors && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <KeyRound className="size-4" />
        )}
        {pending ? "Kaydediliyor..." : "Yeni şifreyi kaydet"}
      </Button>
    </form>
  );
}
