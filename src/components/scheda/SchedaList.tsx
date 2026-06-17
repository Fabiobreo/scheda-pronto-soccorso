"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import StatusChip from "@/components/scheda/StatusChip";
import { useCreateScheda, useDeleteScheda, useSchede } from "@/hooks/useSchede";
import { useToast } from "@/context/ToastContext";
import { CATEGORIE_SINTOMI } from "@/lib/sintomi";
import { etichettaScheda, type SchedaListItem } from "@/lib/scheda";

function riepilogoSintomi(sintomi: SchedaListItem["sintomi"]): string {
  const labels = CATEGORIE_SINTOMI.filter((c) => {
    const sel = sintomi[c.id];
    return sel && (sel.codici.length > 0 || sel.note.trim().length > 0);
  }).map((c) => c.label);
  return labels.length > 0 ? labels.join(", ") : "—";
}

export default function SchedaList({ initialSchede }: { initialSchede: SchedaListItem[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const { data: schede = [] } = useSchede(initialSchede);
  const createScheda = useCreateScheda();
  const deleteScheda = useDeleteScheda();
  const [toDelete, setToDelete] = useState<SchedaListItem | null>(null);

  const handleCreate = () => {
    createScheda.mutate(undefined, {
      onSuccess: (created) => router.push(`/schede/${created.id}`),
      onError: (e) => showToast(e.message, "error"),
    });
  };

  const handleConfirmDelete = () => {
    if (!toDelete) return;
    deleteScheda.mutate(toDelete.id, {
      onSuccess: () => {
        showToast("Scheda eliminata", "success");
        setToDelete(null);
      },
      onError: (e) => showToast(e.message, "error"),
    });
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h1">Schede</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          disabled={createScheda.isPending}
        >
          Nuova scheda
        </Button>
      </Box>

      {schede.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">
            Nessuna scheda. Crea la prima con “Nuova scheda”.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Paziente / Riferimento</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell>Sintomi</TableCell>
                <TableCell>Aggiornata</TableCell>
                <TableCell align="right">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schede.map((scheda) => (
                <TableRow key={scheda.id} hover>
                  <TableCell>
                    <Typography
                      component={Link}
                      href={`/schede/${scheda.id}`}
                      sx={{ color: "primary.main", textDecoration: "none", fontWeight: 600 }}
                    >
                      {etichettaScheda(scheda)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={scheda.status} />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 320, color: "text.secondary" }}>
                    {riepilogoSintomi(scheda.sintomi)}
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
                    {format(new Date(scheda.updatedAt), "d MMM yyyy, HH:mm", { locale: it })}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Elimina">
                      <IconButton
                        size="small"
                        onClick={() => setToDelete(scheda)}
                        aria-label="Elimina scheda"
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={toDelete !== null} onClose={() => setToDelete(null)}>
        <DialogTitle>Eliminare la scheda?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            L’operazione è definitiva e non può essere annullata.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>Annulla</Button>
          <Button color="error" onClick={handleConfirmDelete} disabled={deleteScheda.isPending}>
            Elimina
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
