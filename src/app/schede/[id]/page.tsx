import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import PrintIcon from "@mui/icons-material/Print";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TopBar from "@/components/TopBar";
import StatusChip from "@/components/scheda/StatusChip";
import SchedaEditor from "@/components/scheda/SchedaEditor";
import SchedaView from "@/components/scheda/SchedaView";
import ShareButton from "@/components/scheda/ShareButton";
import { db } from "@/lib/db";
import { etichettaScheda, toContent, type SchedaDTO } from "@/lib/scheda";
import { schedaDetailSelect } from "@/lib/schedaQueries";

export const dynamic = "force-dynamic";

export default async function SchedaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await db.scheda.findFirst({
    where: { id, deletedAt: null },
    select: schedaDetailSelect,
  });
  if (!row) notFound();

  const completedByLabel = row.completedBy ? row.completedBy.name || row.completedBy.email : null;

  const content = toContent(row);
  const scheda: SchedaDTO = {
    ...content,
    id: row.id,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  };

  const isCompleted = scheda.status === "COMPLETED";

  return (
    <>
      <TopBar />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Link href="/">
            <Button size="small" startIcon={<ArrowBackIcon />}>
              Schede
            </Button>
          </Link>
          <StatusChip status={scheda.status} />
        </Box>

        {isCompleted ? (
          <>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Box>
                <Typography variant="h1">{etichettaScheda(scheda)}</Typography>
                {scheda.completedAt && (
                  <Typography variant="body2" color="text.secondary">
                    Completata il{" "}
                    {format(new Date(scheda.completedAt), "d MMMM yyyy, HH:mm", { locale: it })}
                    {completedByLabel ? ` da ${completedByLabel}` : ""}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Link href={`/api/schede/${scheda.id}/pdf`}>
                  <Button variant="outlined" startIcon={<PictureAsPdfIcon />}>
                    PDF
                  </Button>
                </Link>
                <Link href={`/schede/${scheda.id}/stampa`}>
                  <Button variant="contained" startIcon={<PrintIcon />}>
                    Stampa
                  </Button>
                </Link>
                <ShareButton schedaId={scheda.id} etichetta={etichettaScheda(scheda)} />
              </Box>
            </Box>
            <SchedaView content={content} />
          </>
        ) : (
          <SchedaEditor scheda={scheda} />
        )}
      </Container>
    </>
  );
}
