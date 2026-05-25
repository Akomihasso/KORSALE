import type { NextAuthConfig } from "next-auth";

// Edge-safe config (middleware tarafından kullanılır — Prisma/bcrypt YOK)
export default {
  providers: [],
  pages: {
    signIn: "/giris",
  },
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      const isAuthPage =
        pathname.startsWith("/giris") || pathname.startsWith("/sifre-sifirla");

      if (isAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", request.nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
