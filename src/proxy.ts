import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Proxy edge-safe (ex "middleware", rinominato in Next 16): usa SOLO authConfig
// (niente Prisma) per applicare il callback `authorized` su tutte le pagine,
// reindirizzando a /login se non autenticato.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  // Protegge solo le PAGINE. Le route /api sono escluse: si proteggono da sé via
  // getAuthContext()/guard() restituendo 401 JSON (un redirect HTML romperebbe i fetch).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
