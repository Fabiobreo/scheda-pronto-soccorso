// Stub di autenticazione.
//
// L'app parte PUBBLICA: nessuna auth. Questo helper centralizza il punto in cui
// le API route verificano l'autorizzazione, così quando aggiungeremo Auth.js v5
// (Google OAuth + PrismaAdapter, ruoli gerarchici) basterà cambiare QUI senza
// toccare le route. Per ora ritorna sempre "autorizzato".

export interface AuthContext {
  authorized: boolean;
  userId: string | null;
  role: string | null;
}

// `_req` non è ancora usato ma definisce la firma futura (lettura sessione/cookie).
export async function getAuthContext(_req: Request): Promise<AuthContext> {
  return { authorized: true, userId: null, role: null };
}
