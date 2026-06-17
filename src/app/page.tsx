import Container from "@mui/material/Container";
import TopBar from "@/components/TopBar";
import SchedaList from "@/components/scheda/SchedaList";
import { db } from "@/lib/db";
import { normalizeSintomi, type SchedaListItem } from "@/lib/scheda";

// La pagina legge dal DB ad ogni richiesta: niente prerender statico.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const rows = await db.scheda.findMany({
    select: {
      id: true,
      status: true,
      riferimento: true,
      cognome: true,
      nome: true,
      sintomi: true,
      createdAt: true,
      updatedAt: true,
      completedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const schede: SchedaListItem[] = rows.map((r) => ({
    id: r.id,
    status: r.status,
    riferimento: r.riferimento,
    cognome: r.cognome,
    nome: r.nome,
    sintomi: normalizeSintomi(r.sintomi),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    completedAt: r.completedAt?.toISOString() ?? null,
  }));

  return (
    <>
      <TopBar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <SchedaList initialSchede={schede} />
      </Container>
    </>
  );
}
