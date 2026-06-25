import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { UserCreateSchema } from "@/lib/schemas/user";
import { recordAudit } from "@/lib/audit";
import { guard, handleApiError, parseJsonBody } from "@/lib/apiHelpers";

// Campi esposti: MAI passwordHash.
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

export async function GET(req: Request) {
  const g = await guard(req, "users:list", 60, { minRole: "ADMIN" });
  if (!g.ok) return g.response;

  try {
    const users = await db.user.findMany({ select: userSelect, orderBy: { createdAt: "asc" } });
    return NextResponse.json(users);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  const g = await guard(req, "users:create", 20, { minRole: "ADMIN" });
  if (!g.ok) return g.response;

  try {
    const { auth } = g;
    const body = await parseJsonBody(req);
    const { password, ...rest } = UserCreateSchema.parse(body);
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { ...rest, passwordHash },
        select: userSelect,
      });
      await recordAudit(tx, {
        entity: "User",
        entityId: created.id,
        action: "USER_CREATE",
        userId: auth.userId,
        meta: { email: created.email, role: created.role },
      });
      return created;
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
