"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type">;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [gorunur, setGorunur] = React.useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={gorunur ? "text" : "password"}
        className={cn("pr-9", className)}
      />
      <button
        type="button"
        onClick={() => setGorunur((g) => !g)}
        tabIndex={-1}
        aria-label={gorunur ? "Şifreyi gizle" : "Şifreyi göster"}
        title={gorunur ? "Şifreyi gizle" : "Şifreyi göster"}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground focus:outline-none focus-visible:text-foreground"
      >
        {gorunur ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
