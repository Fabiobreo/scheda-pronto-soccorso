import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { AuditAction } from "@prisma/client";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import HistoryIcon from "@mui/icons-material/History";
import TopBar from "@/components/TopBar";
import { auth } from "@/lib/auth";
import { hasMinRole } from "@/lib/roles";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

// Etichette leggibili per le azioni del registro.
const ACTION_LABEL: Record<AuditAction, string> = {
  CREATE: "Creazione",
  UPDATE: "Modifica",
  COMPLETE: "Completamento",
  DELETE: "Spostamento nel cestino",
  RESTORE: "Ripristino",
  PURGE: "Eliminazione definitiva",
  EXPORT: "Esportazione/Stampa",
  USER_CREATE: "Creazione utente",
  USER_UPDATE: "Modifica utente",
  USER_DELETE: "Eliminazione utente",
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!hasMinRole(session?.user?.role, "ADMIN")) redirect("/");

  const { page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw) || 1);

  const [rows, total] = await Promise.all([
    db.auditLog.findMany({
      orderBy: { at: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.auditLog.count(),
  ]);

  // Risolve gli userId in etichette leggibili (nessuna relazione in schema → query a parte).
  const userIds = [...new Set(rows.map((r) => r.userId).filter((id): id is string => !!id))];
  const users = userIds.length
    ? await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const userLabel = new Map(users.map((u) => [u.id, u.name || u.email]));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <TopBar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h1" sx={{ mb: 1 }}>
          Registro accessi e attività
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Tracciamento immutabile delle operazioni sulle schede e sugli utenti (GDPR art. 5).
        </Typography>

        {rows.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: "center" }}>
            <Box sx={{ color: "text.disabled", mb: 1.5, "& svg": { fontSize: 64 } }}>
              <HistoryIcon />
            </Box>
            <Typography color="text.secondary">Nessuna voce nel registro.</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Data e ora</TableCell>
                  <TableCell>Azione</TableCell>
                  <TableCell>Entità</TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Utente</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {format(r.at, "d MMM yyyy, HH:mm:ss", { locale: it })}
                    </TableCell>
                    <TableCell>{ACTION_LABEL[r.action]}</TableCell>
                    <TableCell>{r.entity}</TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8em" }}>
                      {r.entityId}
                    </TableCell>
                    <TableCell>
                      {r.userId ? (userLabel.get(r.userId) ?? r.userId) : "— (sistema)"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Pagina {page} di {totalPages} · {total} voci
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Link href={`/admin/audit?page=${page - 1}`}>
              <Button size="small" disabled={page <= 1}>
                Precedente
              </Button>
            </Link>
            <Link href={`/admin/audit?page=${page + 1}`}>
              <Button size="small" disabled={page >= totalPages}>
                Successiva
              </Button>
            </Link>
          </Box>
        </Box>
      </Container>
    </>
  );
}
