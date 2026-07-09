import { SifreSifirlaIstekForm } from "@/components/sifre-sifirla-istek-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Şifremi unuttum — KORSALE",
};

export default function SifreSifirlaPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Şifremi unuttum</CardTitle>
        <CardDescription>
          Hesabınızın e-posta adresini girin, size şifre sıfırlama bağlantısı
          gönderelim.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SifreSifirlaIstekForm />
      </CardContent>
    </Card>
  );
}
