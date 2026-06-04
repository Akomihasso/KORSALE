"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import {
  teklifOlusturAction,
  teklifGuncelleAction,
} from "@/lib/actions/teklif-actions";
import type { ActionState } from "@/lib/actions/_shared";
import {
  BELGE_TIPI_ETIKET,
  datetimeLocalInputDegeri,
  trTutar,
} from "@/lib/format";
import {
  DESTEKLENEN_PARA_BIRIMLERI,
  PARA_BIRIMI_ETIKET,
  tlyeCevir,
  type ParaBirimi,
} from "@/lib/doviz-kuru";
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
import type { BelgeTipi } from "@prisma/client";

const initialState: ActionState = { ok: false };

type Teklif = {
  id: string;
  firmaId: string;
  gorusmeId: string | null;
  belgeTipi: BelgeTipi;
  baslik: string;
  icerik: string;
  tutar: { toString(): string };
  paraBirimi: string;
  indirimYuzde: { toString(): string } | null;
  kabulOlasilik: number;
  gecerlilikTarih: Date | string | null;
};

type Props = {
  firmalar: FirmaOpsiyonu[];
  varsayilanFirmaId?: string;
  varsayilanGorusmeId?: string;
  indirimOnayEsigi: number;
  kurlar: Record<ParaBirimi, number>;
  teklif?: Teklif;
};

export function TeklifForm({
  firmalar,
  varsayilanFirmaId,
  varsayilanGorusmeId,
  indirimOnayEsigi,
  kurlar,
  teklif,
}: Props) {
  const router = useRouter();
  const isEdit = !!teklif;

  const [belgeTipi, setBelgeTipi] = useState<BelgeTipi>(
    teklif?.belgeTipi ?? "TEKLIF",
  );
  const [tutar, setTutar] = useState<string>(teklif?.tutar?.toString() ?? "");
  const [paraBirimi, setParaBirimi] = useState<ParaBirimi>(
    ((teklif?.paraBirimi ?? "TRY").toUpperCase() as ParaBirimi) ?? "TRY",
  );
  const [indirimYuzde, setIndirimYuzde] = useState<string>(
    teklif?.indirimYuzde?.toString() ?? "",
  );
  const [kabulOlasilik, setKabulOlasilik] = useState<string>(
    teklif?.kabulOlasilik?.toString() ?? "50",
  );

  const [state, formAction, pending] = useActionState(
    isEdit ? teklifGuncelleAction : teklifOlusturAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok && isEdit && teklif) {
      toast.success("Teklif güncellendi");
      router.push(`/teklifler/${teklif.id}`);
    }
  }, [state.ok, isEdit, teklif, router]);

  const netTutar = useMemo(() => {
    const t = Number(tutar.replace(",", "."));
    const i = Number(indirimYuzde.replace(",", "."));
    if (!Number.isFinite(t) || t < 0) return null;
    if (!Number.isFinite(i) || i <= 0) return t;
    return Math.round(t * (1 - i / 100) * 100) / 100;
  }, [tutar, indirimYuzde]);

  const netTutarTl = useMemo(() => {
    if (netTutar === null || paraBirimi === "TRY") return null;
    return tlyeCevir(netTutar, paraBirimi, kurlar);
  }, [netTutar, paraBirimi, kurlar]);

  const indirimSayi = Number(indirimYuzde.replace(",", "."));
  const onayGerekir =
    Number.isFinite(indirimSayi) && indirimSayi >= indirimOnayEsigi;

  return (
    <form action={formAction} className="grid gap-6 md:grid-cols-2">
      {isEdit && <input type="hidden" name="id" value={teklif!.id} />}
      {!isEdit && varsayilanGorusmeId && (
        <input type="hidden" name="gorusmeId" value={varsayilanGorusmeId} />
      )}

      <div className="space-y-2 md:col-span-2">
        <Label>
          Firma <span className="text-destructive">*</span>
        </Label>
        {isEdit ? (
          <>
            <input type="hidden" name="firmaId" value={teklif!.firmaId} />
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {firmalar.find((f) => f.id === teklif!.firmaId)?.ad ?? "—"}
              <span className="ml-2 text-xs">(Belge oluşturulduktan sonra firma değişmez)</span>
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
        <Label htmlFor="belgeTipi">
          Belge tipi <span className="text-destructive">*</span>
        </Label>
        <input type="hidden" name="belgeTipi" value={belgeTipi} />
        <Select value={belgeTipi} onValueChange={(v) => setBelgeTipi(v as BelgeTipi)}>
          <SelectTrigger id="belgeTipi">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(BELGE_TIPI_ETIKET).map(([deger, etiket]) => (
              <SelectItem key={deger} value={deger}>
                {etiket}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="gecerlilikTarih">Geçerlilik tarihi (opsiyonel)</Label>
        <Input
          id="gecerlilikTarih"
          name="gecerlilikTarih"
          type="datetime-local"
          defaultValue={
            teklif?.gecerlilikTarih
              ? datetimeLocalInputDegeri(teklif.gecerlilikTarih)
              : ""
          }
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="baslik">
          Başlık <span className="text-destructive">*</span>
        </Label>
        <Input
          id="baslik"
          name="baslik"
          required
          defaultValue={teklif?.baslik ?? ""}
          placeholder="örn. Marka tescil ve takip hizmeti"
        />
        {state.fieldErrors?.baslik && (
          <p className="text-xs text-destructive">{state.fieldErrors.baslik}</p>
        )}
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="icerik">
          İçerik <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="icerik"
          name="icerik"
          required
          rows={8}
          defaultValue={teklif?.icerik ?? ""}
          placeholder="Kapsam, fiyat dökümü, ödeme planı, garanti ve teslim koşulları..."
          maxLength={20000}
        />
        {state.fieldErrors?.icerik && (
          <p className="text-xs text-destructive">{state.fieldErrors.icerik}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tutar">
          Tutar <span className="text-destructive">*</span>
        </Label>
        <Input
          id="tutar"
          name="tutar"
          type="number"
          step="any"
          min="0"
          inputMode="decimal"
          required
          value={tutar}
          onChange={(e) => setTutar(e.target.value)}
        />
        {state.fieldErrors?.tutar && (
          <p className="text-xs text-destructive">{state.fieldErrors.tutar}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="paraBirimi">Para birimi</Label>
        <input type="hidden" name="paraBirimi" value={paraBirimi} />
        <Select
          value={paraBirimi}
          onValueChange={(v) => setParaBirimi(v as ParaBirimi)}
        >
          <SelectTrigger id="paraBirimi">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DESTEKLENEN_PARA_BIRIMLERI.map((kod) => (
              <SelectItem key={kod} value={kod}>
                {PARA_BIRIMI_ETIKET[kod]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {paraBirimi !== "TRY" && (
          <p className="text-xs text-muted-foreground">
            Kur: 1 {paraBirimi} = {trTutar(kurlar[paraBirimi])} (TCMB)
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="indirimYuzde">İndirim (%)</Label>
        <Input
          id="indirimYuzde"
          name="indirimYuzde"
          type="number"
          step="0.5"
          min="0"
          max="100"
          value={indirimYuzde}
          onChange={(e) => setIndirimYuzde(e.target.value)}
          placeholder="0"
        />
        {state.fieldErrors?.indirimYuzde && (
          <p className="text-xs text-destructive">{state.fieldErrors.indirimYuzde}</p>
        )}
        {onayGerekir && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            %{indirimOnayEsigi} ve üzeri indirim yönetici onayı gerektirir
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="kabulOlasilik">Kabul olasılığı (%)</Label>
        <Input
          id="kabulOlasilik"
          name="kabulOlasilik"
          type="number"
          step="5"
          min="0"
          max="100"
          value={kabulOlasilik}
          onChange={(e) => setKabulOlasilik(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Pipeline tahmini için</p>
      </div>

      {netTutar !== null && (
        <div className="md:col-span-2 rounded-lg border bg-muted/30 px-4 py-3 text-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Net tutar:</span>
            <span className="text-lg font-semibold">
              {trTutar(netTutar, paraBirimi)}
            </span>
          </div>
          {netTutarTl !== null && (
            <div className="flex items-center justify-between border-t pt-1 text-xs">
              <span className="text-muted-foreground">TL karşılığı:</span>
              <span className="font-medium">{trTutar(netTutarTl)}</span>
            </div>
          )}
        </div>
      )}

      {state.error && !state.fieldErrors && (
        <p className="text-sm text-destructive md:col-span-2">{state.error}</p>
      )}

      <div className="flex items-center justify-end gap-2 md:col-span-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
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
