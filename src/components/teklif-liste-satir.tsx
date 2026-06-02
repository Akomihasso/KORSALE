"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { TableRow } from "@/components/ui/table";

type Props = {
  teklifId: string;
  children: ReactNode;
};

export function TeklifListeSatir({ teklifId, children }: Props) {
  const router = useRouter();
  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a")) return;
        router.push(`/teklifler/${teklifId}`);
      }}
    >
      {children}
    </TableRow>
  );
}
