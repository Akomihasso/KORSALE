"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

import {
  kullaniciOlusturAction,
  kullaniciGuncelleAction,
  type ActionState,
} from "@/lib/actions/kullanici-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { UserRole } from "@prisma/client";

const initialState: ActionState = { ok: false };

const ROL_SECENEKLER: { value: UserRole; label: string }[] = [
  { value: "YONETICI", label: "Yönetici" },
  { value: "SATIS", label: "Satış" },
  { value: "OPERASYON", label: "Operasyon" },
  { value: "GOZLEMCI", label: "Gözlemci" },
];

type CreateProps = {
  mode: "create";
};

type EditProps = {
  mode: "edit";
  kullanici: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    isActive: boolean;
  };
};

export function KullaniciFormDialog(props: CreateProps | EditProps) {
  const isEdit = props.mode === "edit";
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<UserRole>(
    isEdit ? props.kullanici.role : "SATIS",
  );
  const [isActive, setIsActive] = useState(isEdit ? props.kullanici.isActive : true);

  const [state, formAction, pending] = useActionState(
    isEdit ? kullaniciGuncelleAction : kullaniciOlusturAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      toast.success(isEdit ? "Kullanıcı güncellendi" : "Kullanıcı oluşturuldu");
      // Form action başarıyla döndüğünde dialog'u kapat — kontrollü modal için
      // bu setState legitim; ESLint heuristic'ini sustur.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
    }
  }, [state.ok, isEdit]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="ghost" size="icon-sm" />
          ) : (
            <Button />
          )
        }
      >
        {isEdit ? (
          <Pencil className="size-4" />
        ) : (
          <>
            <Plus className="size-4" /> Yeni Kullanıcı
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Kullanıcıyı Düzenle" : "Yeni Kullanıcı"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Ad, rol veya aktiflik durumunu güncelleyebilirsiniz. Şifre boş bırakılırsa değişmez."
              : "Kullanıcının e-postası giriş için kullanılır."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={props.kullanici.id} />}

          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={isEdit ? props.kullanici.email : ""}
              disabled={isEdit}
              autoComplete="off"
            />
            {state.fieldErrors?.email && (
              <p className="text-xs text-destructive">{state.fieldErrors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Ad Soyad</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={isEdit ? props.kullanici.name : ""}
            />
            {state.fieldErrors?.name && (
              <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <input type="hidden" name="role" value={role} />
            <Select
              value={role}
              onValueChange={(v) => setRole(v as UserRole)}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROL_SECENEKLER.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Şifre{" "}
              {isEdit && (
                <span className="text-xs font-normal text-muted-foreground">
                  (boş bırakılırsa değişmez, min 8 karakter)
                </span>
              )}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required={!isEdit}
              minLength={isEdit ? 0 : 8}
              autoComplete="new-password"
            />
            {state.fieldErrors?.password && (
              <p className="text-xs text-destructive">{state.fieldErrors.password}</p>
            )}
          </div>

          {isEdit && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Aktif</Label>
                <p className="text-xs text-muted-foreground">
                  Pasif kullanıcılar giriş yapamaz
                </p>
              </div>
              <input type="hidden" name="isActive" value={String(isActive)} />
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          )}

          {state.error && !state.fieldErrors && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {pending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
