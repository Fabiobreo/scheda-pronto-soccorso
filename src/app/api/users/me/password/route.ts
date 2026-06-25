import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthContext } from "@/lib/apiAuth";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import { ApiError, handleApiError, parseJsonBody } from "@/lib/apiHelpers";

const ChangePasswordSchema = z.object({
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
    const { password } = ChangePasswordSchema.parse(body);
    const passwordHash = await bcrypt.hash(password, 10);

    await db.user.update({
      where: { id: auth.userId },
      data: { passwordHash, forcePasswordChange: false },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
