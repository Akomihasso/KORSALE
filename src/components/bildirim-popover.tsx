"use client";

import Link from "next/link";
import { Bell, Check, CheckCheck, Inbox } from "lucide-react";
import type { BildirimTipi } from "@prisma/client";

import {
  bildirimOkuduAction,
  bildirimlerTumunuOkuAction,
} from "@/lib/actions/bildirim-actions";
import { trGoreceli } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Bildirim = {
  id: string;
  tip: BildirimTipi;
  baslik: string;
  icerik: string;
  link: string | null;
  okundu: boolean;
  createdAt: Date | string;
};

type Props = {
  bildirimler: Bildirim[];
  okunmamis: number;
};

export function BildirimPopover({ bildirimler, okunmamis }: Props) {
  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant="ghost" size="icon" className="relative" />}
      >
        <Bell className="size-5" />
        {okunmamis > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-0.5 -right-0.5 h-4 min-w-4 justify-center px-1 text-[10px]"
          >
            {okunmamis > 9 ? "9+" : okunmamis}
          </Badge>
        )}
        <span className="sr-only">Bildirimler</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="text-sm font-medium">Bildirimler</div>
          {okunmamis > 0 && (
            <form action={bildirimlerTumunuOkuAction}>
              <Button type="submit" variant="ghost" size="sm" className="h-7 px-2 text-xs">
                <CheckCheck className="size-3.5" /> Tümünü oku
              </Button>
            </form>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {bildirimler.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-3 py-8 text-center text-muted-foreground">
              <Inbox className="size-6 opacity-30" />
              <p className="text-xs">Bildirim yok</p>
            </div>
          ) : (
            <ul className="divide-y">
              {bildirimler.map((b) => (
                <li
                  key={b.id}
                  className={`px-3 py-2.5 ${b.okundu ? "" : "bg-primary/5"}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      {b.link ? (
                        <Link
                          href={b.link}
                          className="block text-sm font-medium hover:underline"
                        >
                          {b.baslik}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium">{b.baslik}</p>
                      )}
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {b.icerik}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {trGoreceli(b.createdAt)}
                      </p>
                    </div>
                    {!b.okundu && (
                      <form action={bildirimOkuduAction}>
                        <input type="hidden" name="id" value={b.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon-sm"
                          title="Okundu işaretle"
                        >
                          <Check className="size-3.5" />
                        </Button>
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
