import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { getAuthContext } from "@/lib/apiAuth";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

// Guard comune alle API: rate limit (best-effort) + autorizzazione (stub).
// Ritorna una Response se la richiesta va bloccata, altrimenti null.
export async function guard(
  req: Request,
  routeKey: string,
  limit = 60
): Promise<NextResponse | null> {
  const rl = rateLimit(`${routeKey}:${getClientIp(req)}`, limit);
  if (!rl.ok) {
    const retryAfter = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Troppe richieste, riprova più tardi" },
      { status: 429, headers: { "Retry-After": String(Math.max(1, retryAfter)) } }
    );
  }

  const auth = await getAuthContext(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  return null;
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
  console.error("Errore API non gestito:", error);
  return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
}
