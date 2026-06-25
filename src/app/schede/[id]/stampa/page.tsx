import { notFound } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import PrintControls from "@/components/scheda/PrintControls";
import SchedaView from "@/components/scheda/SchedaView";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { etichettaScheda, toContent } from "@/lib/scheda";
import { schedaDetailSelect } from "@/lib/schedaQueries";

export const dynamic = "force-dynamic";

export default async function StampaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await db.scheda.findFirst({ where: { id, deletedAt: null }, select: schedaDetailSelect });
  if (!row) notFound();

  const session = await auth();
  await recordAudit(db, {
    entity: "Scheda",
    entityId: id,
    action: "EXPORT",
    userId: session?.user?.id ?? null,
  });

  const content = toContent(row);
  const etichetta = etichettaScheda(content);
  const titolo = etichetta === "(senza riferimento)" ? "Scheda di pronto soccorso" : etichetta;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <PrintControls />

      <Box sx={{ mb: 3 }}>
        <Typography variant="h1">{titolo}</Typography>
        <Typography variant="body2" color="text.secondary">
          {row.status === "COMPLETED" && row.completedAt
            ? `Completata il ${format(new Date(row.completedAt), "d MMMM yyyy, HH:mm", { locale: it })}`
            : `Bozza · aggiornata il ${format(new Date(row.updatedAt), "d MMMM yyyy, HH:mm", { locale: it })}`}
        </Typography>
      </Box>

      <SchedaView content={content} />
    </Container>
  );
}
