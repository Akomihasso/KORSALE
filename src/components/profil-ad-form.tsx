"use client";

import { useActionState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { profilGuncelleAction } from "@/lib/actions/profil-actions";
import type { ActionState } from "@/lib/actions/_shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = { ok: false };

export function ProfilAdForm({ name }: { name: string }) {
  const [state, formAction, pending] = useActionState(
    profilGuncelleAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok) toast.success("Profil bilgileriniz güncellendi");
  }, [state.ok]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">
          Ad Soyad <span className="text-destructive">*</span>
        </Label>
        <Input id="name" name="name" required defaultValue={name} minLength={2} />
        {state.fieldErrors?.name && (
          <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
        )}
      </div>

      {state.error && !state.fieldErrors && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {pending ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </div>
    </form>
  );
}
