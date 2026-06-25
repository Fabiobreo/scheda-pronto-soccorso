import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import type { Role } from "@prisma/client";
import { getAuthContext, type AuthContext } from "@/lib/apiAuth";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { hasMinRole } from "@/lib/roles";
import { logger } from "@/lib/logger";

interface GuardOptions {
  minRole?: Role;
}

export type GuardResult =
  | { ok: false; response: NextResponse }
  | { ok: true; auth: AuthContext };

// Guard comune alle API: rate limit (best-effort) + autenticazione + ruolo minimo.
// Restituisce l'AuthContext già calcolato così le route non devono chiamare
// getAuthContext() una seconda volta (evita due decodifiche JWT per richiesta).
export async function guard(
  req: Request,
  routeKey: string,
  limit = 60,
  options: GuardOptions = {}
): Promise<GuardResult> {
  const rl = rateLimit(`${routeKey}:${getClientIp(req)}`, limit);
  if (!rl.ok) {
    const retryAfter = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Troppe richieste, riprova più tardi" },
        { status: 429, headers: { "Retry-After": String(Math.max(1, retryAfter)) } }
      ),
    };
  }

  const auth = await getAuthContext(req);
  if (!auth.authorized) {
    return { ok: false, response: NextResponse.json({ error: "Non autorizzato" }, { status: 401 }) };
  }
  if (options.minRole && !hasMinRole(auth.role, options.minRole)) {
    return { ok: false, response: NextResponse.json({ error: "Permessi insufficienti" }, { status: 403 }) };
  }

  return { ok: true, auth };
}

// Legge e valida il body JSON; lancia per essere gestito da handleApiError.
export async function parseJsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, "Body JSON non valido");
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Traduce gli errori noti in risposte HTTP coerenti.
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Dati non validi", issues: error.issues }, { status: 400 });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Scheda non trovata" }, { status: 404 });
    }
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Valore duplicato" }, { status: 409 });
    }
  }
  logger.error("Errore API non gestito", error);
  return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
}
