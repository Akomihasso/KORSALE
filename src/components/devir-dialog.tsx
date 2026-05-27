"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert, Users } from "lucide-react";
import { toast } from "sonner";

import { devirOlusturAction } from "@/lib/actions/devir-actions";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DevirHedefTipi } from "@prisma/client";

const initialState: ActionState = { ok: false };

type Kullanici = {
  id: string;
  name: string;
  rolEtiketi: string;
};

type Props = {
  hedefTipi: DevirHedefTipi;
  hedefId: string;
  hedefBaslik: string;
  mevcutSorumluId: string;
  kullanicilar: Kullanici[];
  zorlaDevir?: boolean; // Yönetici başkasının kaydında
  triggerLabel?: string;
};

const MIN_NOT = 50;

export function DevirDialog({
  hedefTipi,
  hedefId,
  hedefBaslik,
  mevcutSorumluId,
  kullanicilar,
  zorlaDevir = false,
  triggerLabel = "Devret",
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [devralanId, setDevralanId] = useState<string>("");
  const [devirNotu, setDevirNotu] = useState("");

  const [state, formAction, pending] = useActionState(
    devirOlusturAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      toast.success(
        zorlaDevir ? "Zorla devir tamamlandı" : "Devir talebi gönderildi",
      );
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      setDevralanId("");
      setDevirNotu("");
      router.refresh();
    }
  }, [state.ok, zorlaDevir, router]);

  const adaylar = kullanicilar.filter((k) => k.id !== mevcutSorumluId);
  const kalan = Math.max(0, MIN_NOT - devirNotu.trim().length);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant={zorlaDevir ? "destructive" : "outline"} size="sm" />
        }
      >
        <Users className="size-4" /> {triggerLabel}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {zorlaDevir ? "Zorla Devir (Yönetici)" : "Görevi Devret"}
          </DialogTitle>
          <DialogDescription>
            {hedefBaslik}
          </DialogDescription>
        </DialogHeader>

        {zorlaDevir && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs">
            <ShieldAlert className="mt-0.5 size-4 text-destructive" />
            <p>
              Zorla devirde sorumluluk anında değişir; devralanın kabul/red şansı yoktur.
              Yalnızca gerektiğinde kullanın — sebebi devir notuna yazın.
            </p>
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="hedefTipi" value={hedefTipi} />
          <input type="hidden" name="hedefId" value={hedefId} />
          <input type="hidden" name="devralanId" value={devralanId} />

          <div className="space-y-2">
            <Label htmlFor="devralan">
              Devralan <span className="text-destructive">*</span>
            </Label>
            <Select
              value={devralanId}
              onValueChange={(v) => setDevralanId(v ?? "")}
            >
              <SelectTrigger id="devralan">
                <SelectValue placeholder="Kullanıcı seçin..." />
              </SelectTrigger>
              <SelectContent>
                {adaylar.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    {k.name}{" "}
                    <span className="text-xs text-muted-foreground">
                      · {k.rolEtiketi}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.fieldErrors?.devralanId && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.devralanId}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="devirNotu">
              Devir notu <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="devirNotu"
              name="devirNotu"
              rows={5}
              required
              minLength={MIN_NOT}
              maxLength={2000}
              value={devirNotu}
              onChange={(e) => setDevirNotu(e.target.value)}
              placeholder="Neden devrediyorsun? Devralanın bağlam için bilmesi gerekenler neler? Sonraki adımlar?"
            />
            <div className="flex justify-between text-xs">
              <span
                className={
                  kalan > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                }
              >
                {kalan > 0
                  ? `En az ${kalan} karakter daha`
                  : `${devirNotu.trim().length} karakter`}
              </span>
              <span className="text-muted-foreground">en az {MIN_NOT}, en fazla 2000</span>
            </div>
            {state.fieldErrors?.devirNotu && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.devirNotu}
              </p>
            )}
          </div>

          {state.error && !state.fieldErrors && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={pending || !devralanId || kalan > 0}
              variant={zorlaDevir ? "destructive" : "default"}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {pending
                ? "Gönderiliyor..."
                : zorlaDevir
                  ? "Zorla devret"
                  : "Devri başlat"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
