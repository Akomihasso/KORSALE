import Link from "next/link";
import { ShieldOff } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata = { title: "Yetkisiz" };

export default function YetkiYokPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-destructive/10 p-4 text-destructive">
        <ShieldOff className="size-10" />
      </div>
      <div>
        <h1 className="text-xl font-semibold">Bu sayfaya erişim yetkiniz yok</h1>
        <p className="text-sm text-muted-foreground">
          Lütfen yöneticinizle iletişime geçin veya ana sayfaya dönün.
        </p>
      </div>
      <Button render={<Link href="/" />}>Ana sayfa</Button>
    </div>
  );
}
