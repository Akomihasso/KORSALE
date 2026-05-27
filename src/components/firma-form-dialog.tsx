"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  firmaOlusturAction,
  firmaGuncelleAction,
} from "@/lib/actions/firma-actions";
import { KAYNAKLAR } from "@/lib/firma-constants";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState: ActionState = { ok: false };

type Firma = {
  id: string;
  ad: string;
  sektor: string | null;
  sehir: string | null;
  telefon: string | null;
  email: string | null;
  web: string | null;
  kaynak: string | null;
  notlar: string | null;
};

type Props =
  | { mode: "create"; trigger?: "button" | "icon" }
  | { mode: "edit"; firma: Firma; trigger?: "button" | "icon" };

export function FirmaFormDialog(props: Props) {
  const isEdit = props.mode === "edit";
  const [open, setOpen] = useState(false);
  const [kaynak, setKaynak] = useState<string>(
    isEdit ? props.firma.kaynak ?? "" : "",
  );

  const [state, formAction, pending] = useActionState(
    isEdit ? firmaGuncelleAction : firmaOlusturAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok && isEdit) {
      toast.success("Firma güncellendi");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
    }
  }, [state.ok, isEdit]);

  const f = isEdit ? props.firma : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          props.trigger === "icon" ? (
            <Button variant="ghost" size="icon-sm" />
          ) : isEdit ? (
            <Button variant="outline" size="sm" />
          ) : (
            <Button />
          )
        }
      >
        {isEdit ? (
          <>
            <Pencil className="size-4" /> Düzenle
          </>
        ) : (
          <>
            <Plus className="size-4" /> Yeni Firma
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Firmayı Düzenle" : "Yeni Firma"}</DialogTitle>
          <DialogDescription>
            Sadece firma adı zorunludur. Diğer alanlar sonradan doldurulabilir.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-4 sm:grid-cols-2">
          {isEdit && <input type="hidden" name="id" value={f!.id} />}

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="ad">
              Firma adı <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ad"
              name="ad"
              required
              defaultValue={f?.ad ?? ""}
              autoComplete="organization"
            />
            {state.fieldErrors?.ad && (
              <p className="text-xs text-destructive">{state.fieldErrors.ad}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sektor">Sektör</Label>
            <Input id="sektor" name="sektor" defaultValue={f?.sektor ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sehir">Şehir</Label>
            <Input id="sehir" name="sehir" defaultValue={f?.sehir ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefon">Telefon</Label>
            <Input
              id="telefon"
              name="telefon"
              defaultValue={f?.telefon ?? ""}
              autoComplete="tel"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={f?.email ?? ""}
              autoComplete="email"
            />
            {state.fieldErrors?.email && (
              <p className="text-xs text-destructive">{state.fieldErrors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="web">Web sitesi</Label>
            <Input
              id="web"
              name="web"
              type="url"
              placeholder="https://..."
              defaultValue={f?.web ?? ""}
            />
            {state.fieldErrors?.web && (
              <p className="text-xs text-destructive">{state.fieldErrors.web}</p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="kaynak">Kaynak (firmayla nasıl tanışıldı?)</Label>
            <input type="hidden" name="kaynak" value={kaynak} />
            <Select value={kaynak} onValueChange={(v) => setKaynak(v ?? "")}>
              <SelectTrigger id="kaynak">
                <SelectValue placeholder="Seçiniz (opsiyonel)" />
              </SelectTrigger>
              <SelectContent>
                {KAYNAKLAR.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notlar">Notlar</Label>
            <Textarea
              id="notlar"
              name="notlar"
              rows={3}
              defaultValue={f?.notlar ?? ""}
              maxLength={2000}
            />
          </div>

          {state.error && !state.fieldErrors && (
            <p className="text-sm text-destructive sm:col-span-2">{state.error}</p>
          )}

          <DialogFooter className="sm:col-span-2">
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
