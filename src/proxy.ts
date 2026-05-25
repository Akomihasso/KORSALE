import NextAuth from "next-auth";
import authConfig from "@/auth.config";

// Edge runtime'da çalışır — sadece edge-safe authConfig (no Prisma/bcrypt)
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: [
    // Tüm route'ları koru — istisnalar:
    //  - /api/auth (NextAuth handler'ları)
    //  - _next/static, _next/image (Next iç dosyaları)
    //  - favicon ve resimler
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
