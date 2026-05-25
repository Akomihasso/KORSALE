"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import {
  gorusmeOlusturAction,
  gorusmeGuncelleAction,
} from "@/lib/actions/gorusme-actions";
import type { ActionState } from "@/lib/actions/_shared";
import {
  GORUSME_SONUC_ETIKET,
  GORUSME_TIPI_ETIKET,
  datetimeLocalInputDegeri,
} from "@/lib/format";
import { FirmaSecici, type FirmaOpsiyonu } from "@/components/firma-secici";
import { Button } from "@/components/ui/button";
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
import type { GorusmeSonuc, GorusmeTipi } from "@prisma/client";

const initialState: ActionState = { ok: false };

type Gorusme = {
  id: string;
  firmaId: string;
  tarih: Date | string;
  tip: GorusmeTipi;
  yer: string | null;
  konu: string;
  ozet: string;
  sonuc: GorusmeSonuc;
  tahminiTutar: { toString(): string } | null;
  hatirlatma: Date | string | null;
};

type Props = {
  firmalar: FirmaOpsiyonu[];
  varsayilanFirmaId?: string;
  gorusme?: Gorusme;
};

export function GorusmeForm({ firmalar, varsayilanFirmaId, gorusme }: Props) {
  const router = useRouter();
  const isEdit = !!gorusme;

  const [tip, setTip] = useState<GorusmeTipi>(gorusme?.tip ?? "TELEFON");
  const [sonuc, setSonuc] = useState<GorusmeSonuc>(
    gorusme?.sonuc ?? "BILGI_VERILDI",
  );

  const [state, formAction, pending] = useActionState(
    isEdit ? gorusmeGuncelleAction : gorusmeOlusturAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok && isEdit && gorusme) {
      toast.success("Görüşme güncellendi");
      router.push(`/gorusmeler/${gorusme.id}`);
    }
  }, [state.ok, isEdit, gorusme, router]);

  const varsayilanTarih = gorusme?.tarih
    ? datetimeLocalInputDegeri(gorusme.tarih)
    : datetimeLocalInputDegeri(new Date());

  return (
    <form action={formAction} className="grid gap-6 md:grid-cols-2">
      {isEdit && <input type="hidden" name="id" value={gorusme!.id} />}

      <div className="space-y-2 md:col-span-2">
        <Label>
          Firma <span className="text-destructive">*</span>
        </Label>
        {isEdit ? (
          // edit'te firma değişmez — gizli input olarak gönder
          <>
            <input type="hidden" name="firmaId" value={gorusme!.firmaId} />
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {firmalar.find((f) => f.id === gorusme!.firmaId)?.ad ?? "—"}
              <span className="ml-2 text-xs">
                (Firma değişikliği için yeni görüşme oluşturun)
              </span>
            </div>
          </>
        ) : (
          <FirmaSecici firmalar={firmalar} varsayilanId={varsayilanFirmaId} />
        )}
        {state.fieldErrors?.firmaId && (
          <p className="text-xs text-destructive">{state.fieldErrors.firmaId}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tarih">
          Tarih <span className="text-destructive">*</span>
        </Label>
        <Input
          id="tarih"
          name="tarih"
          type="datetime-local"
          required
          defaultValue={varsayilanTarih}
        />
        {state.fieldErrors?.tarih && (
          <p className="text-xs text-destructive">{state.fieldErrors.tarih}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tip">
          Tip <span className="text-destructive">*</span>
        </Label>
        <input type="hidden" name="tip" value={tip} />
        <Select value={tip} onValueChange={(v) => setTip(v as GorusmeTipi)}>
          <SelectTrigger id="tip">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(GORUSME_TIPI_ETIKET).map(([deger, etiket]) => (
              <SelectItem key={deger} value={deger}>
                {etiket}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="yer">Yer / Platform (opsiyonel)</Label>
        <Input
          id="yer"
          name="yer"
          defaultValue={gorusme?.yer ?? ""}
          placeholder="örn. Firma ofisi, Zoom, fuar standı"
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="konu">
          Konu <span className="text-destructive">*</span>
        </Label>
        <Input
          id="konu"
          name="konu"
          required
          defaultValue={gorusme?.konu ?? ""}
          placeholder="örn. Marka tescil görüşmesi"
        />
        {state.fieldErrors?.konu && (
          <p className="text-xs text-destructive">{state.fieldErrors.konu}</p>
        )}
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="ozet">
          Özet <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="ozet"
          name="ozet"
          required
          rows={5}
          defaultValue={gorusme?.ozet ?? ""}
          placeholder="Görüşmede konuşulanlar, kararlar, sonraki adımlar..."
          maxLength={4000}
        />
        {state.fieldErrors?.ozet && (
          <p className="text-xs text-destructive">{state.fieldErrors.ozet}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="sonuc">
          Sonuç <span className="text-destructive">*</span>
        </Label>
        <input type="hidden" name="sonuc" value={sonuc} />
        <Select value={sonuc} onValueChange={(v) => setSonuc(v as GorusmeSonuc)}>
          <SelectTrigger id="sonuc">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(GORUSME_SONUC_ETIKET).map(([deger, etiket]) => (
              <SelectItem key={deger} value={deger}>
                {etiket}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tahminiTutar">Tahmini iş tutarı (₺)</Label>
        <Input
          id="tahminiTutar"
          name="tahminiTutar"
          type="number"
          step="100"
          min="0"
          defaultValue={gorusme?.tahminiTutar?.toString() ?? ""}
          placeholder="Pipeline için (opsiyonel)"
        />
        {state.fieldErrors?.tahminiTutar && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.tahminiTutar}
          </p>
        )}
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="hatirlatma">Hatırlatma (opsiyonel)</Label>
        <Input
          id="hatirlatma"
          name="hatirlatma"
          type="datetime-local"
          defaultValue={
            gorusme?.hatirlatma ? datetimeLocalInputDegeri(gorusme.hatirlatma) : ""
          }
        />
        <p className="text-xs text-muted-foreground">
          Belirlediğin tarihte bildirim alırsın (Sprint 5{"'"}te aktif)
        </p>
      </div>

      {state.error && !state.fieldErrors && (
        <p className="text-sm text-destructive md:col-span-2">{state.error}</p>
      )}

      <div className="flex items-center justify-end gap-2 md:col-span-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          İptal
        </Button>
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
