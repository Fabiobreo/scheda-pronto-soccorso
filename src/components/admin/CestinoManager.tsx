"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import RestoreIcon from "@mui/icons-material/Restore";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import StatusChip from "@/components/scheda/StatusChip";
import { useToast } from "@/context/ToastContext";
import { useRestoreScheda, usePurgeScheda, TRASH_KEY } from "@/hooks/useSchede";
import type { SchedaStatus } from "@prisma/client";

export interface SchedaTrashItem {
  id: string;
  etichetta: string;
  status: SchedaStatus;
  deletedAt: string;
}

async function fetchTrash(): Promise<SchedaTrashItem[]> {
  const res = await fetch("/api/schede/trash");
  if (!res.ok) throw new Error("Errore nel caricamento del cestino");
  return res.json();
}

export default function CestinoManager({ initialItems }: { initialItems: SchedaTrashItem[] }) {
  const { showToast } = useToast();
  const { data: items = [] } = useQuery({
    queryKey: TRASH_KEY,
    queryFn: fetchTrash,
    initialData: initialItems,
  });
  const restore = useRestoreScheda();
  const purge = usePurgeScheda();
  const [toPurge, setToPurge] = useState<SchedaTrashItem | null>(null);

  const handleRestore = (id: string) => {
    restore.mutate(id, {
      onSuccess: () => showToast("Scheda ripristinata", "success"),
      onError: (e) => showToast(e.message, "error"),
    });
  };

  const handleConfirmPurge = () => {
    if (!toPurge) return;
    purge.mutate(toPurge.id, {
      onSuccess: () => {
        showToast("Scheda eliminata definitivamente", "success");
        setToPurge(null);
      },
      onError: (e) => showToast(e.message, "error"),
    });
  };

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 3 }}>
        Cestino
      </Typography>

      {items.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <Box sx={{ color: "text.disabled", mb: 1.5, "& svg": { fontSize: 64 } }}>
            <DeleteSweepIcon />
          </Box>
          <Typography color="text.secondary">Il cestino è vuoto.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Paziente / Riferimento</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell>Eliminata</TableCell>
                <TableCell align="right">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.etichetta}</TableCell>
                  <TableCell>
                    <StatusChip status={item.status} />
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
                    {format(new Date(item.deletedAt), "d MMM yyyy, HH:mm", { locale: it })}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    <Button
                      size="small"
                      startIcon={<RestoreIcon />}
                      onClick={() => handleRestore(item.id)}
                      disabled={restore.isPending}
                    >
                      Ripristina
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteForeverIcon />}
                      onClick={() => setToPurge(item)}
                    >
                      Elimina
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={toPurge !== null} onClose={() => setToPurge(null)}>
        <DialogTitle>Eliminare definitivamente?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            La scheda «{toPurge?.etichetta}» verrà rimossa in modo permanente dal database.
            L’operazione non può essere annullata.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToPurge(null)}>Annulla</Button>
          <Button color="error" onClick={handleConfirmPurge} disabled={purge.isPending}>
            Elimina definitivamente
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
