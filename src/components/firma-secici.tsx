"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type FirmaOpsiyonu = {
  id: string;
  ad: string;
  sektor?: string | null;
  sehir?: string | null;
};

type Props = {
  firmalar: FirmaOpsiyonu[];
  varsayilanId?: string;
  fieldName?: string; // hidden input name
  placeholder?: string;
};

export function FirmaSecici({
  firmalar,
  varsayilanId,
  fieldName = "firmaId",
  placeholder = "Firma seçin...",
}: Props) {
  const [open, setOpen] = useState(false);
  const [secili, setSecili] = useState<string | undefined>(varsayilanId);

  const seciliFirma = firmalar.find((f) => f.id === secili);

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
            <CommandInput placeholder="Firma ara..." />
            <CommandList>
              <CommandEmpty>Eşleşen firma bulunamadı</CommandEmpty>
              <CommandGroup>
                {firmalar.map((f) => (
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
                      <div className="truncate">{f.ad}</div>
                      {(f.sektor || f.sehir) && (
                        <div className="truncate text-xs text-muted-foreground">
                          {[f.sektor, f.sehir].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
