import type { NextAuthConfig } from "next-auth";

// Config Auth.js "edge-safe": NESSUN import di Prisma/bcrypt (Node-only) qui, così
// può girare nel middleware (edge runtime). Il Credentials provider, che usa Prisma,
// vive in src/lib/auth.ts che fa lo spread di questa config.

const PUBLIC_PREFIXES = ["/login"];

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  // Providers reali aggiunti in src/lib/auth.ts (qui vuoto per l'edge).
  providers: [],
  callbacks: {
    // Protegge tutte le route tranne quelle pubbliche. Usata dal middleware.
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
      if (isPublic) return true;
      return isLoggedIn;
    },
    // Propaga id e ruolo nel token alla login; restano disponibili offline.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    // Espone id e ruolo lato client/server tramite la sessione.
    session({ session, token }) {
      if (token.id) session.user.id = token.id;
      if (token.role) session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;
