// Punto unico in cui le API route verificano l'autorizzazione.
//
// Legge la sessione Auth.js (JWT) e ritorna il contesto utente. Le route non
// cambiano: passano da `guard()` (apiHelpers.ts) che a sua volta chiama qui.

import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";

export interface AuthContext {
  authorized: boolean;
  userId: string | null;
  role: Role | null;
}

// `_req` non è usato: Auth.js legge i cookie dalla request corrente via headers().
export async function getAuthContext(_req: Request): Promise<AuthContext> {
  const session = await auth();
  if (!session?.user) {
    return { authorized: false, userId: null, role: null };
  }
  return { authorized: true, userId: session.user.id, role: session.user.role };
}
