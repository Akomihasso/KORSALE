import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  toplam: number;
  sayfa: number;
  sayfaBoyutu: number;
  baseHref: string; // örn "/firmalar?q=abc"
};

export function Sayfalama({ toplam, sayfa, sayfaBoyutu, baseHref }: Props) {
  const toplamSayfa = Math.max(1, Math.ceil(toplam / sayfaBoyutu));
  if (toplamSayfa <= 1) return null;

  const baslangic = (sayfa - 1) * sayfaBoyutu + 1;
  const bitis = Math.min(sayfa * sayfaBoyutu, toplam);
  const ayrac = baseHref.includes("?") ? "&" : "?";

  const linkFor = (s: number) => `${baseHref}${ayrac}sayfa=${s}`;

  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground">
        {baslangic}–{bitis} / {toplam}
      </p>
      <div className="flex items-center gap-1">
        <Link
          href={linkFor(Math.max(1, sayfa - 1))}
          aria-disabled={sayfa <= 1}
          className={cn(
            "flex h-8 items-center gap-1 rounded-md border px-2 text-xs hover:bg-muted",
            sayfa <= 1 && "pointer-events-none opacity-40",
          )}
        >
          <ChevronLeft className="size-3.5" /> Önceki
        </Link>
        <span className="px-2 text-xs text-muted-foreground">
          Sayfa {sayfa} / {toplamSayfa}
        </span>
        <Link
          href={linkFor(Math.min(toplamSayfa, sayfa + 1))}
          aria-disabled={sayfa >= toplamSayfa}
          className={cn(
            "flex h-8 items-center gap-1 rounded-md border px-2 text-xs hover:bg-muted",
            sayfa >= toplamSayfa && "pointer-events-none opacity-40",
          )}
        >
          Sonraki <ChevronRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
