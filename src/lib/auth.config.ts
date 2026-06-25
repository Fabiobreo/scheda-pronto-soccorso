import type { NextAuthConfig } from "next-auth";

// Config Auth.js "edge-safe": NESSUN import di Prisma/bcrypt (Node-only) qui, così
// può girare nel middleware (edge runtime). Il Credentials provider, che usa Prisma,
// vive in src/lib/auth.ts che fa lo spread di questa config.

const PUBLIC_PREFIXES = ["/login", "/cambia-password", "/privacy"];

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  // Sessione JWT a vita breve: dati sanitari su postazioni potenzialmente condivise.
  // maxAge 8h = una turnazione; updateAge 1h = rinnovo del token durante l'uso.
  // L'auto-logout per inattività (più aggressivo) è gestito da IdleLogout lato client.
  session: { strategy: "jwt", maxAge: 8 * 60 * 60, updateAge: 60 * 60 },
  // Providers reali aggiunti in src/lib/auth.ts (qui vuoto per l'edge).
  providers: [],
  callbacks: {
    // Protegge tutte le route tranne quelle pubbliche. Usata dal middleware.
    // Se l'utente ha forcePasswordChange, forza la redirect a /cambia-password.
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
      if (isPublic) return true;
      if (!isLoggedIn) return false;
      if (auth.user.forcePasswordChange && pathname !== "/cambia-password") {
        const url = request.nextUrl.clone();
        url.pathname = "/cambia-password";
        return Response.redirect(url);
      }
      return true;
    },
    // Propaga id, ruolo e forcePasswordChange nel token alla login.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.forcePasswordChange = user.forcePasswordChange ?? false;
      }
      return token;
    },
    // Espone id, ruolo e forcePasswordChange tramite la sessione.
    session({ session, token }) {
      if (token.id) session.user.id = token.id;
      if (token.role) session.user.role = token.role;
      session.user.forcePasswordChange = token.forcePasswordChange ?? false;
      return session;
    },
  },
} satisfies NextAuthConfig;
