import { redirect } from "next/navigation";
import Container from "@mui/material/Container";
import TopBar from "@/components/TopBar";
import CestinoManager, { type SchedaTrashItem } from "@/components/admin/CestinoManager";
import { auth } from "@/lib/auth";
import { hasMinRole } from "@/lib/roles";
import { db } from "@/lib/db";
import { etichettaScheda } from "@/lib/scheda";

export const dynamic = "force-dynamic";

export default async function CestinoPage() {
  const session = await auth();
  if (!hasMinRole(session?.user?.role, "ADMIN")) redirect("/");

  const rows = await db.scheda.findMany({
    where: { deletedAt: { not: null } },
    select: {
      id: true,
      riferimento: true,
      cognome: true,
      nome: true,
      status: true,
      deletedAt: true,
    },
    orderBy: { deletedAt: "desc" },
  });

  const items: SchedaTrashItem[] = rows.map((r) => ({
    id: r.id,
    etichetta: etichettaScheda(r),
    status: r.status,
    deletedAt: r.deletedAt!.toISOString(),
  }));

  return (
    <>
      <TopBar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <CestinoManager initialItems={items} />
      </Container>
    </>
  );
}
