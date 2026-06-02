"use client";

import { LogOut, Settings, User } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  name: string;
  email: string;
  rolEtiketi: string;
};

function bashHarfler(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

async function cikis() {
  try {
    const r = await fetch("/api/auth/csrf");
    const { csrfToken } = (await r.json()) as { csrfToken: string };
    const fd = new FormData();
    fd.set("csrfToken", csrfToken);
    fd.set("callbackUrl", "/giris");
    await fetch("/api/auth/signout", {
      method: "POST",
      body: fd,
      redirect: "manual",
    });
  } finally {
    window.location.href = "/giris";
  }
}

export function UserMenu({ name, email, rolEtiketi }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-lg" className="rounded-full" />}
      >
        <Avatar className="size-8">
          <AvatarFallback>{bashHarfler(name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{name}</span>
            <span className="text-xs text-muted-foreground">{email}</span>
            <span className="text-xs text-muted-foreground">{rolEtiketi}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/profil" />}>
          <User className="size-4" />
          Profilim
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/ayarlar" />}>
          <Settings className="size-4" />
          Ayarlar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            void cikis();
          }}
        >
          <LogOut className="size-4" />
          Çıkış Yap
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
