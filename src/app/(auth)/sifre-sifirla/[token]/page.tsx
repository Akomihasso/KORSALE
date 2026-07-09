import Link from "next/link";

import { tokenGecerliMi } from "@/lib/actions/sifre-sifirla-actions";
import { SifreSifirlaYeniForm } from "@/components/sifre-sifirla-yeni-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const metadata = {
  title: "Yeni şifre — KORSALE",
};

type Params = Promise<{ token: string }>;

export default async function SifreSifirlaTokenPage({
  params,
}: {
  params: Params;
}) {
  const { token } = await params;
  const gecerli = await tokenGecerliMi(token);

  if (!gecerli) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Bağlantı geçersiz</CardTitle>
          <CardDescription>
            Bu şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              Yeni bir sıfırlama isteği başlatarak tekrar deneyin.
            </AlertDescription>
          </Alert>
          <Link
            href="/sifre-sifirla"
            className="block text-center text-sm text-primary hover:underline"
          >
            Yeni istek başlat
          </Link>
          <Link
            href="/giris"
            className="block text-center text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            Giriş ekranına dön
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Yeni şifre belirle</CardTitle>
        <CardDescription>
          Yeni şifreniz en az 8 karakter olmalı. Kaydettikten sonra yeni
          şifrenizle giriş yapabilirsiniz.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SifreSifirlaYeniForm token={token} />
      </CardContent>
    </Card>
  );
}
