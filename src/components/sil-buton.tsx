"use client";

import { useRef, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  id: string;
  action: (formData: FormData) => void | Promise<void>;
  onayMetni?: string;
  etiket?: string;
};

/**
 * Yönetici-only sil butonu — tıklayınca confirm dialog, onayda action çalıştırır.
 * Server action'ı dışarıdan alır, yetki kontrolü server tarafında yapılır.
 */
export function SilButon({
  id,
  action,
  onayMetni = "Bu kaydı silmek istediğinizden emin misiniz?",
  etiket = "Sil",
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={(e) => {
        if (!confirm(onayMetni)) {
          e.preventDefault();
          return;
        }
        setYukleniyor(true);
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={yukleniyor}
        className="gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        {yukleniyor ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Trash2 className="size-3.5" />
        )}
        {etiket}
      </Button>
    </form>
  );
}
