"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Loader2, MessageSquare, Plus } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  firmaHizliOlusturAction,
  type FirmaHizliState,
} from "@/lib/actions/firma-actions";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type FirmaOpsiyonu = {
  id: string;
  ad: string;
  sektor?: string | null;
  sehir?: string | null;
  /**
   * Bu firmaya yapılmış toplam görüşme sayısı. Teklif/Talimat/Sözleşme oluştururken
   * görüşmesi olan firmaları üstte gösterip funnel'la bağlantıyı netleştirir.
   */
  gorusmeSayisi?: number;
  /** En son görüşmenin tarihi (en yeni). */
  sonGorusmeTarih?: Date | string | null;
};

function gunFarki(d: Date | string | null | undefined): number | null {
  if (!d) return null;
  const tarih = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(tarih.getTime())) return null;
  const ms = Date.now() - tarih.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function gorusmeRozetMetni(gun: number | null) {
  if (gun === null) return null;
  if (gun <= 0) return "bugün";
  if (gun === 1) return "dün";
  if (gun < 7) return `${gun} gün önce`;
  if (gun < 30) return `${Math.floor(gun / 7)} hf önce`;
  if (gun < 365) return `${Math.floor(gun / 30)} ay önce`;
  return `${Math.floor(gun / 365)} yıl önce`;
}

const initialHizliState: FirmaHizliState = { ok: false };

type Props = {
  firmalar: FirmaOpsiyonu[];
  varsayilanId?: string;
  fieldName?: string;
  placeholder?: string;
  hizliEklemeKapali?: boolean;
};

export function FirmaSecici({
  firmalar: ilkFirmalar,
  varsayilanId,
  fieldName = "firmaId",
  placeholder = "Firma seçin...",
  hizliEklemeKapali = false,
}: Props) {
  const [firmalar, setFirmalar] = useState<FirmaOpsiyonu[]>(ilkFirmalar);
  const [open, setOpen] = useState(false);
  const [secili, setSecili] = useState<string | undefined>(varsayilanId);
  const [hizliOpen, setHizliOpen] = useState(false);
  const [adArama, setAdArama] = useState("");

  const seciliFirma = firmalar.find((f) => f.id === secili);

  // Çağıran sayfa görüşme metadata'sı verdiyse (en az birinde gorusmeSayisi varsa)
  // listeyi ikiye böleriz; vermediyse klasik alfabetik tek listeyi gösteririz.
  const gorusmeBilgisiVar = useMemo(
    () => firmalar.some((f) => f.gorusmeSayisi !== undefined),
    [firmalar],
  );

  const { gorusmeli, gorusmesiz } = useMemo(() => {
    if (!gorusmeBilgisiVar) {
      return { gorusmeli: [] as FirmaOpsiyonu[], gorusmesiz: firmalar };
    }
    const ileGorusme = firmalar.filter((f) => (f.gorusmeSayisi ?? 0) > 0);
    const sirali = [...ileGorusme].sort((a, b) => {
      const ta = a.sonGorusmeTarih
        ? new Date(a.sonGorusmeTarih).getTime()
        : 0;
      const tb = b.sonGorusmeTarih
        ? new Date(b.sonGorusmeTarih).getTime()
        : 0;
      return tb - ta;
    });
    const yok = firmalar
      .filter((f) => !((f.gorusmeSayisi ?? 0) > 0))
      .sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
    return { gorusmeli: sirali, gorusmesiz: yok };
  }, [firmalar, gorusmeBilgisiVar]);

  const [state, formAction, pending] = useActionState(
    firmaHizliOlusturAction,
    initialHizliState,
  );

  useEffect(() => {
    if (state.ok && state.firma) {
      const yeni = state.firma;
      toast.success(`"${yeni.ad}" eklendi`);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFirmalar((prev) => {
        if (prev.some((f) => f.id === yeni.id)) return prev;
        return [...prev, yeni].sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
      });
      setSecili(yeni.id);
      setHizliOpen(false);
      setAdArama("");
    }
  }, [state.ok, state.firma]);

  return (
    <>
      <input type="hidden" name={fieldName} value={secili ?? ""} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              type="button"
              className="w-full justify-between font-normal"
              aria-expanded={open}
            />
          }
        >
          <span className={cn(!seciliFirma && "text-muted-foreground")}>
            {seciliFirma ? seciliFirma.ad : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[var(--anchor-width)] min-w-[280px] p-0">
          <Command>
            <CommandInput
              placeholder="Firma ara..."
              value={adArama}
              onValueChange={setAdArama}
            />
            <CommandList>
              <CommandEmpty>
                <div className="space-y-2 px-2 py-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    Eşleşen firma yok
                  </p>
                  {!hizliEklemeKapali && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setOpen(false);
                        setHizliOpen(true);
                      }}
                    >
                      <Plus className="size-3.5" />
                      {adArama ? `"${adArama}" olarak ekle` : "Yeni firma ekle"}
                    </Button>
                  )}
                </div>
              </CommandEmpty>
              {gorusmeli.length > 0 && (
                <CommandGroup heading="Görüşme yapılmış firmalar">
                  {gorusmeli.map((f) => {
                    const gun = gunFarki(f.sonGorusmeTarih);
                    const rozet = gorusmeRozetMetni(gun);
                    return (
                      <CommandItem
                        key={f.id}
                        value={`${f.ad} ${f.sektor ?? ""} ${f.sehir ?? ""}`}
                        onSelect={() => {
                          setSecili(f.id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "size-4",
                            secili === f.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium">{f.ad}</span>
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                              <MessageSquare className="size-3" />
                              {f.gorusmeSayisi}
                              {rozet ? ` · ${rozet}` : ""}
                            </span>
                          </div>
                          {(f.sektor || f.sehir) && (
                            <div className="truncate text-xs text-muted-foreground">
                              {[f.sektor, f.sehir].filter(Boolean).join(" · ")}
                            </div>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {gorusmesiz.length > 0 && (
                <CommandGroup
                  heading={
                    gorusmeBilgisiVar
                      ? gorusmeli.length > 0
                        ? "Görüşme yok"
                        : "Görüşmesi olmayan firmalar"
                      : undefined
                  }
                >
                  {gorusmesiz.map((f) => (
                    <CommandItem
                      key={f.id}
                      value={`${f.ad} ${f.sektor ?? ""} ${f.sehir ?? ""}`}
                      onSelect={() => {
                        setSecili(f.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "size-4",
                          secili === f.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{f.ad}</span>
                          {gorusmeBilgisiVar && (
                            <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                              görüşme yok
                            </span>
                          )}
                        </div>
                        {(f.sektor || f.sehir) && (
                          <div className="truncate text-xs text-muted-foreground">
                            {[f.sektor, f.sehir].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {!hizliEklemeKapali && firmalar.length > 0 && (
                <div className="border-t p-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setOpen(false);
                      setHizliOpen(true);
                    }}
                  >
                    <Plus className="size-3.5" /> Yeni firma ekle
                  </Button>
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Hızlı firma oluşturma dialog'u */}
      <Dialog open={hizliOpen} onOpenChange={setHizliOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Firma</DialogTitle>
            <DialogDescription>
              Sadece firma adı zorunlu. Detayları sonra Firmalar sayfasından tamamlayabilirsiniz.
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="hizli-ad">
                Firma adı <span className="text-destructive">*</span>
              </Label>
              <Input
                id="hizli-ad"
                name="ad"
                required
                defaultValue={adArama}
                placeholder="örn. Atlas Tekstil A.Ş."
              />
              {state.fieldErrors?.ad && (
                <p className="text-xs text-destructive">{state.fieldErrors.ad}</p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="hizli-sektor">Sektör</Label>
                <Input id="hizli-sektor" name="sektor" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hizli-sehir">Şehir</Label>
                <Input id="hizli-sehir" name="sehir" />
              </div>
            </div>

            {state.error && !state.fieldErrors && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setHizliOpen(false)}
              >
                İptal
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                {pending ? "Ekleniyor..." : "Ekle ve seç"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
