"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { dokumanYukleAction } from "@/lib/actions/dokuman-actions";
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

const initialState: ActionState = { ok: false };

type Props = {
  kategori: string;
  kategoriEtiket: string;
};

export function DokumanYukleDialog({ kategori, kategoriEtiket }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    dokumanYukleAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      toast.success("Doküman yüklendi");
      setOpen(false);
    }
  }, [state.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" /> Doküman Yükle
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Doküman Yükle — {kategoriEtiket}</DialogTitle>
          <DialogDescription>
            Kod, revizyon ve başlık birlikte listede &quot;KOD-REVIZYON-BAŞLIK&quot;
            formatında görünür. PDF, Word, Excel veya görsel yükleyebilirsiniz (en fazla 20 MB).
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="kategori" value={kategori} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="kod">
                Kod <span className="text-destructive">*</span>
              </Label>
              <Input id="kod" name="kod" required placeholder="SISTEM003" />
              {state.fieldErrors?.kod && (
                <p className="text-xs text-destructive">{state.fieldErrors.kod}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="revizyon">Revizyon</Label>
              <Input id="revizyon" name="revizyon" defaultValue="R0" maxLength={8} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="baslik">
              Başlık <span className="text-destructive">*</span>
            </Label>
            <Input
              id="baslik"
              name="baslik"
              required
              placeholder="STRATEJİ VE PAZARLAMA SİSTEMİ"
            />
            {state.fieldErrors?.baslik && (
              <p className="text-xs text-destructive">{state.fieldErrors.baslik}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dosya">
              Dosya <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dosya"
              name="dosya"
              type="file"
              required
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.svg,.txt"
            />
          </div>

          {state.error && !state.fieldErrors && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {pending ? "Yükleniyor..." : "Yükle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
