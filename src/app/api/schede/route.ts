import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SchedaCreateSchema } from "@/lib/schemas/scheda";
import { guard, handleApiError, parseJsonBody } from "@/lib/apiHelpers";

// Campi esposti nella lista (no payload pesanti non necessari, ma includiamo
// `sintomi` per il riepilogo categorie in UI).
const listSelect = {
  id: true,
  status: true,
  riferimento: true,
  cognome: true,
  nome: true,
  sintomi: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
} as const;

export async function GET(req: Request) {
  const blocked = await guard(req, "schede:list", 120);
  if (blocked) return blocked;

  try {
    const schede = await db.scheda.findMany({
      select: listSelect,
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(schede);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  const blocked = await guard(req, "schede:create", 30);
  if (blocked) return blocked;

  try {
    const body = await parseJsonBody(req);
    const data = SchedaCreateSchema.parse(body);
    const scheda = await db.scheda.create({ data });
    return NextResponse.json(scheda, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
