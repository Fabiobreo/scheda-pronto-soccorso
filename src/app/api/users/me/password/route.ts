import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthContext } from "@/lib/apiAuth";
import { recordAudit } from "@/lib/audit";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { ApiError, handleApiError, parseJsonBody } from "@/lib/apiHelpers";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Inserisci la password attuale"),
  password: z.string().min(8, "La password deve avere almeno 8 caratteri").max(200),
});

export async function POST(req: Request) {
  // Rate limit per IP: max 10 tentativi/minuto.
  const ip = getClientIp(req);
  const rl = rateLimit(`password-change:${ip}`, 10);
  if (!rl.ok) {
    return NextResponse.json({ error: "Troppe richieste, riprova più tardi" }, { status: 429 });
  }

  try {
    const auth = await getAuthContext(req);
    if (!auth.authorized || !auth.userId) {
      throw new ApiError(401, "Non autorizzato");
    }

    const body = await parseJsonBody(req);
    const { currentPassword, password } = ChangePasswordSchema.parse(body);

    // Verifica la password attuale: impedisce a una sessione lasciata aperta di
    // essere usata per cambiare la password senza conoscere quella corrente.
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { passwordHash: true },
    });
    if (!user) throw new ApiError(404, "Utente non trovato");
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new ApiError(400, "Password attuale non corretta");

    const passwordHash = await bcrypt.hash(password, 10);
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: auth.userId! },
        data: { passwordHash, forcePasswordChange: false },
      });
      await recordAudit(tx, {
        entity: "User",
        entityId: auth.userId!,
        action: "USER_UPDATE",
        userId: auth.userId,
        meta: { self: true, passwordChange: true },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
