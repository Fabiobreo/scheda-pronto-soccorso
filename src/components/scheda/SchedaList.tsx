"use client";

import { useEffect, useRef, useState } from "react";
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
import TableSortLabel from "@mui/material/TableSortLabel";
import TablePagination from "@mui/material/TablePagination";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import StatusChip from "@/components/scheda/StatusChip";
import {
  useCreateScheda,
  useDeleteScheda,
  useSchede,
  schedaParamsToSearch,
} from "@/hooks/useSchede";
import { useToast } from "@/context/ToastContext";
import { CATEGORIE_SINTOMI } from "@/lib/sintomi";
import { etichettaScheda, type SchedaListItem } from "@/lib/scheda";
import type { SchedaListParams, SchedaListResult, SchedaSortField } from "@/lib/schedaQueries";

function riepilogoSintomi(sintomi: SchedaListItem["sintomi"]): string {
  const labels = CATEGORIE_SINTOMI.filter((c) => {
    const sel = sintomi[c.id];
    return sel && (sel.codici.length > 0 || sel.note.trim().length > 0);
  }).map((c) => c.label);
  return labels.length > 0 ? labels.join(", ") : "—";
}

const SEARCH_DEBOUNCE_MS = 350;

export default function SchedaList({
  initialResult,
  initialParams,
}: {
  initialResult: SchedaListResult;
  initialParams: SchedaListParams;
}) {
  const router = useRouter();
  const { showToast } = useToast();

  const [params, setParams] = useState<SchedaListParams>(initialParams);
  // Testo digitato (immediato) separato dal `q` applicato (debounced).
  const [searchText, setSearchText] = useState(initialParams.q);

  // initialData vale solo finché i params coincidono con quelli server-rendered.
  const sameAsInitial = schedaParamsToSearch(params) === schedaParamsToSearch(initialParams);
  const { data } = useSchede(params, sameAsInitial ? initialResult : undefined);
  const result = data ?? initialResult;

  const createScheda = useCreateScheda();
  const deleteScheda = useDeleteScheda();
  const [toDelete, setToDelete] = useState<SchedaListItem | null>(null);

  // Sincronizza i parametri con l'URL (shareable / back-button) senza ricaricare.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const qs = schedaParamsToSearch(params);
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }, [params, router]);

  // Debounce della ricerca: aggiorna `q` (e torna a pagina 1) dopo l'inattività.
  useEffect(() => {
    if (searchText === params.q) return;
    const t = setTimeout(() => {
      setParams((p) => ({ ...p, q: searchText, page: 1 }));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchText, params.q]);

  const handleSort = (field: SchedaSortField) => {
    setParams((p) => ({
      ...p,
      sort: field,
      dir: p.sort === field && p.dir === "desc" ? "asc" : "desc",
      page: 1,
    }));
  };

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
        showToast("Scheda spostata nel cestino", "success");
        setToDelete(null);
      },
      onError: (e) => showToast(e.message, "error"),
    });
  };

  const items = result.items;

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

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Cerca per cognome, nome o riferimento"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ minWidth: 280, flexGrow: 1 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          select
          size="small"
          label="Stato"
          value={params.status ?? ""}
          onChange={(e) =>
            setParams((p) => ({
              ...p,
              status: (e.target.value || undefined) as SchedaListParams["status"],
              page: 1,
            }))
          }
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">Tutti</MenuItem>
          <MenuItem value="DRAFT">Bozza</MenuItem>
          <MenuItem value="COMPLETED">Completata</MenuItem>
        </TextField>
      </Box>

      {items.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">
            {params.q || params.status
              ? "Nessuna scheda corrisponde ai filtri."
              : "Nessuna scheda. Crea la prima con “Nuova scheda”."}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sortDirection={params.sort === "cognome" ? params.dir : false}>
                  <TableSortLabel
                    active={params.sort === "cognome"}
                    direction={params.sort === "cognome" ? params.dir : "asc"}
                    onClick={() => handleSort("cognome")}
                  >
                    Paziente / Riferimento
                  </TableSortLabel>
                </TableCell>
                <TableCell>Stato</TableCell>
                <TableCell>Sintomi</TableCell>
                <TableCell sortDirection={params.sort === "updatedAt" ? params.dir : false}>
                  <TableSortLabel
                    active={params.sort === "updatedAt"}
                    direction={params.sort === "updatedAt" ? params.dir : "asc"}
                    onClick={() => handleSort("updatedAt")}
                  >
                    Aggiornata
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((scheda) => (
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
                    <Tooltip title="Sposta nel cestino">
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
          <TablePagination
            component="div"
            count={result.total}
            page={result.page - 1}
            rowsPerPage={result.pageSize}
            onPageChange={(_, newPage) => setParams((p) => ({ ...p, page: newPage + 1 }))}
            onRowsPerPageChange={(e) =>
              setParams((p) => ({ ...p, pageSize: parseInt(e.target.value, 10), page: 1 }))
            }
            rowsPerPageOptions={[10, 20, 50, 100]}
            labelRowsPerPage="Per pagina:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} di ${count}`}
          />
        </TableContainer>
      )}

      <Dialog open={toDelete !== null} onClose={() => setToDelete(null)}>
        <DialogTitle>Spostare la scheda nel cestino?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            La scheda verrà spostata nel cestino. Un amministratore può ripristinarla o eliminarla
            definitivamente.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>Annulla</Button>
          <Button color="error" onClick={handleConfirmDelete} disabled={deleteScheda.isPending}>
            Sposta nel cestino
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
