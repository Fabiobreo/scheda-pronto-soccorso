import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { UserUpdateSchema } from "@/lib/schemas/user";
import { recordAudit } from "@/lib/audit";
import { ApiError, guard, handleApiError, parseJsonBody } from "@/lib/apiHelpers";

type Params = { params: Promise<{ id: string }> };

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  disabled: true,
  forcePasswordChange: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function PUT(req: Request, { params }: Params) {
  const g = await guard(req, "user:update", 30, { minRole: "ADMIN" });
  if (!g.ok) return g.response;

  try {
    const { id } = await params;
    const { auth } = g;
    const body = await parseJsonBody(req);
    const { password, ...rest } = UserUpdateSchema.parse(body);

    const data: Prisma.UserUpdateInput = { ...rest };
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
      // Reset della password da admin: forza il cambio al prossimo login.
      data.forcePasswordChange = true;
    }

    // Impedisce a un ADMIN di togliersi i privilegi o disabilitarsi da solo.
    if (auth.userId === id && (rest.role === "NURSE" || rest.role === "SUPERVISOR" || rest.disabled)) {
      throw new ApiError(409, "Non puoi rimuovere i tuoi privilegi o disabilitarti");
    }

    // Protezione ultimo ADMIN attivo: se si sta degradando o disabilitando un ADMIN,
    // verifica che ne resti almeno un altro attivo.
    if (rest.role === "NURSE" || rest.role === "SUPERVISOR" || rest.disabled) {
      const target = await db.user.findUnique({ where: { id }, select: { role: true, disabled: true } });
      if (target?.role === "ADMIN" && !target.disabled) {
        const activeAdmins = await db.user.count({ where: { role: "ADMIN", disabled: false } });
        if (activeAdmins <= 1) {
          throw new ApiError(409, "Deve restare almeno un amministratore attivo");
        }
      }
    }

    const user = await db.$transaction(async (tx) => {
      const updated = await tx.user.update({ where: { id }, data, select: userSelect });
      const meta: Prisma.InputJsonValue = {
        fields: Object.keys(rest),
        ...(password ? { passwordReset: true } : {}),
      };
      await recordAudit(tx, {
        entity: "User",
        entityId: id,
        action: "USER_UPDATE",
        userId: auth.userId,
        meta,
      });
      return updated;
    });
    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const g = await guard(req, "user:delete", 20, { minRole: "ADMIN" });
  if (!g.ok) return g.response;

  try {
    const { id } = await params;
    const { auth } = g;
    if (auth.userId === id) {
      throw new ApiError(409, "Non puoi eliminare il tuo stesso account");
    }

    // Protezione ultimo ADMIN attivo.
    const target = await db.user.findUnique({ where: { id }, select: { role: true, disabled: true } });
    if (target?.role === "ADMIN" && !target.disabled) {
      const activeAdmins = await db.user.count({ where: { role: "ADMIN", disabled: false } });
      if (activeAdmins <= 1) {
        throw new ApiError(409, "Deve restare almeno un amministratore attivo");
      }
    }

    await db.$transaction(async (tx) => {
      await tx.user.delete({ where: { id } });
      await recordAudit(tx, {
        entity: "User",
        entityId: id,
        action: "USER_DELETE",
        userId: auth.userId,
      });
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
