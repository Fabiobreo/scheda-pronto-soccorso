import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";
import { logger } from "@/lib/logger";

// Config completa Auth.js (runtime Node): aggiunge il Credentials provider che usa
// Prisma + bcrypt. Esporta gli handler per la route e gli helper `auth/signIn/signOut`.

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = CredentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          logger.warn("[auth] credenziali con formato non valido");
          return null;
        }

        const { email, password } = parsed.data;
        const normalized = email.toLowerCase();
        const user = await db.user.findUnique({ where: { email: normalized } });

        // DIAGNOSTICA TEMPORANEA (rimuovere dopo il debug del login in prod).
        // Non logga MAI la password: solo se l'utente esiste e se l'hash combacia.
        logger.info("[auth] tentativo login", {
          email: normalized,
          utenteTrovato: !!user,
          disabilitato: user?.disabled ?? null,
        });

        if (!user || user.disabled) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        logger.info("[auth] esito verifica password", { email: normalized, passwordCombacia: ok });
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
});
