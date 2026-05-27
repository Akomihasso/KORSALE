import { Construction } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  baslik: string;
  sprint: string;
  aciklama: string;
  ozellikler?: string[];
};

export function YapimAsamasinda({ baslik, sprint, aciklama, ozellikler }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            <Construction className="size-5" />
          </div>
          <div>
            <CardTitle className="text-xl">{baslik}</CardTitle>
            <CardDescription>{sprint} kapsamında gelecek</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">{aciklama}</p>
        {ozellikler && ozellikler.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            {ozellikler.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
