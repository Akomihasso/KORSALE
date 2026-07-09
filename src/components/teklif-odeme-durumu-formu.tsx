"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { teklifOdemeDurumuAction } from "@/lib/actions/teklif-actions";
import { TEKLIF_ODEME_DURUM_SECENEKLERI } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  teklifId: string;
  mevcut: string | null;
  duzenlenebilir: boolean;
};

const OZEL = "__ozel__";

export function TeklifOdemeDurumuFormu({
  teklifId,
  mevcut,
  duzenlenebilir,
}: Props) {
  const hazirMi = mevcut
    ? (TEKLIF_ODEME_DURUM_SECENEKLERI as readonly string[]).includes(mevcut)
    : true;
  const [secim, setSecim] = useState<string>(
    mevcut ? (hazirMi ? mevcut : OZEL) : "",
  );
  const [ozelMetin, setOzelMetin] = useState<string>(
    hazirMi ? "" : (mevcut ?? ""),
  );
  const [pending, startTransition] = useTransition();

  if (!duzenlenebilir) {
    if (!mevcut) return null;
    return (
      <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs">
        <span className="text-muted-foreground">Ödeme durumu: </span>
        <span className="font-medium">{mevcut}</span>
      </div>
    );
  }

  const handleSubmit = () => {
    startTransition(async () => {
      const deger = secim === OZEL ? ozelMetin.trim() : secim;
      const fd = new FormData();
      fd.set("id", teklifId);
      fd.set("odemeDurumu", deger);
      await teklifOdemeDurumuAction(fd);
      toast.success(
        deger ? "Ödeme durumu güncellendi" : "Ödeme durumu temizlendi",
      );
    });
  };

  return (
    <form action={handleSubmit} className="space-y-2 rounded-md border bg-muted/20 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs font-medium text-muted-foreground">
          Ödeme durumu:
        </label>
        <select
          value={secim}
          onChange={(e) => setSecim(e.target.value)}
          className="min-w-[200px] rounded-md border bg-background px-2 py-1.5 text-sm"
        >
          <option value="">— seçilmedi —</option>
          {TEKLIF_ODEME_DURUM_SECENEKLERI.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
          <option value={OZEL}>Özel metin…</option>
        </select>
        {secim === OZEL && (
          <Input
            value={ozelMetin}
            onChange={(e) => setOzelMetin(e.target.value)}
            placeholder="Kısa açıklama"
            maxLength={200}
            className="w-64"
          />
        )}
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Save className="size-3.5" />
          )}
          Kaydet
        </Button>
      </div>
    </form>
  );
}
