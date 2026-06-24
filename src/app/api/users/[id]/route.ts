import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { UserUpdateSchema } from "@/lib/schemas/user";
import { getAuthContext } from "@/lib/apiAuth";
import { ApiError, guard, handleApiError, parseJsonBody } from "@/lib/apiHelpers";

type Params = { params: Promise<{ id: string }> };

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  disabled: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function PUT(req: Request, { params }: Params) {
  const blocked = await guard(req, "user:update", 30, { minRole: "ADMIN" });
  if (blocked) return blocked;

  try {
    const { id } = await params;
    const body = await parseJsonBody(req);
    const { password, ...rest } = UserUpdateSchema.parse(body);

    const data: Prisma.UserUpdateInput = { ...rest };
    if (password) data.passwordHash = await bcrypt.hash(password, 10);

    // Impedisce a un ADMIN di togliersi i privilegi o disabilitarsi da solo
    // (eviterebbe il blocco totale dell'accesso amministrativo).
    const auth = await getAuthContext(req);
    if (
      auth.userId === id &&
      (rest.role === "NURSE" || rest.role === "SUPERVISOR" || rest.disabled)
    ) {
      throw new ApiError(409, "Non puoi rimuovere i tuoi privilegi o disabilitarti");
    }

    const user = await db.user.update({ where: { id }, data, select: userSelect });
    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const blocked = await guard(req, "user:delete", 20, { minRole: "ADMIN" });
  if (blocked) return blocked;

  try {
    const { id } = await params;
    const auth = await getAuthContext(req);
    if (auth.userId === id) {
      throw new ApiError(409, "Non puoi eliminare il tuo stesso account");
    }
    await db.user.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
