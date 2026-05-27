"use client";

import { useActionState, useEffect, useRef } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { sifreDegistirAction } from "@/lib/actions/profil-actions";
import type { ActionState } from "@/lib/actions/_shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = { ok: false };

export function SifreDegistirForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    sifreDegistirAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      toast.success("Şifreniz değiştirildi");
      formRef.current?.reset();
    }
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mevcutSifre">
          Mevcut şifre <span className="text-destructive">*</span>
        </Label>
        <Input
          id="mevcutSifre"
          name="mevcutSifre"
          type="password"
          autoComplete="current-password"
          required
        />
        {state.fieldErrors?.mevcutSifre && (
          <p className="text-xs text-destructive">{state.fieldErrors.mevcutSifre}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="yeniSifre">
            Yeni şifre <span className="text-destructive">*</span>
          </Label>
          <Input
            id="yeniSifre"
            name="yeniSifre"
            type="password"
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
          <Input
            id="yeniSifreTekrar"
            name="yeniSifreTekrar"
            type="password"
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
      </div>

      <p className="text-xs text-muted-foreground">
        Şifreniz en az 8 karakter olmalı.
      </p>

      {state.error && !state.fieldErrors && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <KeyRound className="size-4" />
          )}
          {pending ? "Değiştiriliyor..." : "Şifreyi değiştir"}
        </Button>
      </div>
    </form>
  );
}
