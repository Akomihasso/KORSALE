import { Loader2 } from "lucide-react";

export default function AppLoading() {
  return (
    <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-6 animate-spin" />
        <span className="text-sm">Yükleniyor…</span>
      </div>
    </div>
  );
}
