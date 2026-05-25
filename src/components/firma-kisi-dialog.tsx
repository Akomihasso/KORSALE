"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  firmaKisiOlusturAction,
  firmaKisiGuncelleAction,
} from "@/lib/actions/firma-kisi-actions";
import type { ActionState } from "@/lib/actions/_shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const initialState: ActionState = { ok: false };

type Kisi = {
  id: string;
  ad: string;
  unvan: string | null;
  telefon: string | null;
  email: string | null;
  birincil: boolean;
};

type Props =
  | { mode: "create"; firmaId: string }
  | { mode: "edit"; firmaId: string; kisi: Kisi };

export function FirmaKisiDialog(props: Props) {
  const isEdit = props.mode === "edit";
  const [open, setOpen] = useState(false);
  const [birincil, setBirincil] = useState(isEdit ? props.kisi.birincil : false);

  const [state, formAction, pending] = useActionState(
    isEdit ? firmaKisiGuncelleAction : firmaKisiOlusturAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      toast.success(isEdit ? "Kişi güncellendi" : "Kişi eklendi");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
    }
  }, [state.ok, isEdit]);

  const k = isEdit ? props.kisi : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? <Button variant="ghost" size="icon-sm" /> : <Button size="sm" />
        }
      >
        {isEdit ? (
          <Pencil className="size-4" />
        ) : (
          <>
            <Plus className="size-4" /> Kişi ekle
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Kişiyi Düzenle" : "Yeni Kişi"}</DialogTitle>
          <DialogDescription>
            Birincil kişi firmayla iletişim için varsayılan kullanılır.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="firmaId" value={props.firmaId} />
          {isEdit && <input type="hidden" name="id" value={k!.id} />}

          <div className="space-y-2">
            <Label htmlFor="ad">
              Ad Soyad <span className="text-destructive">*</span>
            </Label>
            <Input id="ad" name="ad" required defaultValue={k?.ad ?? ""} />
            {state.fieldErrors?.ad && (
              <p className="text-xs text-destructive">{state.fieldErrors.ad}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="unvan">Unvan</Label>
            <Input id="unvan" name="unvan" defaultValue={k?.unvan ?? ""} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="telefon">Telefon</Label>
              <Input
                id="telefon"
                name="telefon"
                defaultValue={k?.telefon ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={k?.email ?? ""}
              />
              {state.fieldErrors?.email && (
                <p className="text-xs text-destructive">{state.fieldErrors.email}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="birincil">Birincil kişi</Label>
              <p className="text-xs text-muted-foreground">
                Bu kişi varsayılan iletişim noktası olur
              </p>
            </div>
            <input type="hidden" name="birincil" value={String(birincil)} />
            <Switch
              id="birincil"
              checked={birincil}
              onCheckedChange={setBirincil}
            />
          </div>

          {state.error && !state.fieldErrors && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {pending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
