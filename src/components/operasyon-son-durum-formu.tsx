"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { operasyonSonDurumDegistirAction } from "@/lib/actions/operasyon-actions";
import { OPERASYON_SON_DURUM_SECENEKLERI } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  operasyonId: string;
  mevcut: string | null;
  duzenlenebilir: boolean;
};

const OZEL = "__ozel__";

export function OperasyonSonDurumFormu({
  operasyonId,
  mevcut,
  duzenlenebilir,
}: Props) {
  const hazirMi = mevcut
    ? (OPERASYON_SON_DURUM_SECENEKLERI as readonly string[]).includes(mevcut)
    : true;
  const [secim, setSecim] = useState<string>(
    mevcut ? (hazirMi ? mevcut : OZEL) : "",
  );
  const [ozelMetin, setOzelMetin] = useState<string>(hazirMi ? "" : (mevcut ?? ""));
  const [pending, startTransition] = useTransition();

  if (!duzenlenebilir) return null;

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const deger =
        secim === OZEL ? ozelMetin.trim() : (formData.get("sonDurum") as string) ?? "";
      const fd = new FormData();
      fd.set("id", operasyonId);
      fd.set("sonDurum", deger);
      await operasyonSonDurumDegistirAction(fd);
      toast.success(deger ? "Son durum güncellendi" : "Son durum temizlendi");
    });
  };

  return (
    <form action={handleSubmit} className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-muted-foreground">Son durum:</label>
        <select
          name="sonDurum"
          value={secim}
          onChange={(e) => setSecim(e.target.value)}
          className="min-w-[220px] rounded-md border bg-background px-2 py-1.5 text-sm"
        >
          <option value="">— seçilmedi —</option>
          {OPERASYON_SON_DURUM_SECENEKLERI.map((s) => (
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
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          Kaydet
        </Button>
      </div>
    </form>
  );
}
