"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Skeleton from "@mui/material/Skeleton";
import TablePagination from "@mui/material/TablePagination";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import InboxIcon from "@mui/icons-material/Inbox";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import StatusChip from "@/components/scheda/StatusChip";
import TriageChip from "@/components/scheda/TriageChip";
import {
  useCreateScheda,
  useDeleteScheda,
  useSchede,
  schedaParamsToSearch,
} from "@/hooks/useSchede";
import { useToast } from "@/context/ToastContext";
import { CATEGORIE_SINTOMI } from "@/lib/sintomi";
import { etichettaScheda, type SchedaListItem } from "@/lib/scheda";
import {
  SCHEDA_SORT_FIELDS,
  type SchedaListParams,
  type SchedaListResult,
  type SchedaSortField,
} from "@/lib/schedaQueries";

// Riferimento da mostrare come riga secondaria: solo se presente e diverso
// dall'etichetta principale (altrimenti sarebbe già visibile come titolo).
function riferimentoSecondario(scheda: SchedaListItem): string | null {
  const rif = scheda.riferimento.trim();
  if (!rif || etichettaScheda(scheda) === rif) return null;
  return rif;
}

function riepilogoSintomi(sintomi: SchedaListItem["sintomi"]): string {
  const labels = CATEGORIE_SINTOMI.filter((c) => {
    const sel = sintomi[c.id];
    return sel && (sel.codici.length > 0 || sel.note.trim().length > 0);
  }).map((c) => c.label);
  return labels.length > 0 ? labels.join(", ") : "—";
}

// Riga descrittiva secondaria: "Rif. X · sintomi" (omette le parti assenti).
function rigaSecondaria(scheda: SchedaListItem): string {
  const parts: string[] = [];
  const rif = riferimentoSecondario(scheda);
  if (rif) parts.push(`Rif. ${rif}`);
  const sint = riepilogoSintomi(scheda.sintomi);
  if (sint !== "—") parts.push(sint);
  return parts.join(" · ") || "—";
}

const SEARCH_DEBOUNCE_MS = 350;
const TRIAGE_OPTIONS = ["Rosso", "Arancione", "Azzurro", "Verde", "Bianco"];
const SORT_LABELS: Record<SchedaSortField, string> = {
  updatedAt: "Aggiornata",
  createdAt: "Creazione",
  cognome: "Cognome",
};

type ViewMode = "list" | "grid";
const VIEW_STORAGE_KEY = "schede-view";

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

  // Vista lista/griglia, ricordata in localStorage. Default "list" (anche lato SSR
  // per evitare mismatch di hydration); il valore salvato viene letto dopo il mount.
  const [view, setView] = useState<ViewMode>("list");
  useEffect(() => {
    // localStorage è disponibile solo lato client: si legge DOPO il mount, di
    // proposito, per non causare un mismatch di hydration (il server rende "list").
    const saved = localStorage.getItem(VIEW_STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === "grid" || saved === "list") setView(saved);
  }, []);
  const changeView = (next: ViewMode | null) => {
    if (!next) return;
    setView(next);
    localStorage.setItem(VIEW_STORAGE_KEY, next);
  };

  // initialData vale solo finché i params coincidono con quelli server-rendered.
  const sameAsInitial = schedaParamsToSearch(params) === schedaParamsToSearch(initialParams);
  const { data, isFetching } = useSchede(params, sameAsInitial ? initialResult : undefined);
  const result = data ?? initialResult;
  // Skeleton solo al caricamento "freddo" (params diversi dall'iniziale, nessun dato ancora).
  const showSkeleton = !data && !sameAsInitial;

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

  const hasActiveFilters = Boolean(
    params.q || params.status || params.triage || params.dataFrom || params.dataTo
  );

  const handleClearFilters = () => {
    setSearchText("");
    setParams((p) => ({
      ...p,
      q: "",
      status: undefined,
      triage: undefined,
      dataFrom: undefined,
      dataTo: undefined,
      page: 1,
    }));
  };

  const items = result.items;

  const pagination = (
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
  );

  const fadeSx = { opacity: isFetching ? 0.6 : 1, transition: "opacity 0.2s" } as const;

  return (
    <Box>
      <Box
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2 }}
      >
        <Box>
          <Typography variant="h1">Schede</Typography>
          <Typography variant="body2" color="text.secondary">
            {result.total === 1 ? "1 scheda" : `${result.total} schede`}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          disabled={createScheda.isPending}
        >
          Nuova scheda
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3, display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Cerca per cognome, nome o riferimento"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ minWidth: 240, flexGrow: 1 }}
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
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">Tutti</MenuItem>
          <MenuItem value="DRAFT">Bozza</MenuItem>
          <MenuItem value="COMPLETED">Completata</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="Triage"
          value={params.triage ?? ""}
          onChange={(e) => setParams((p) => ({ ...p, triage: e.target.value || undefined, page: 1 }))}
          sx={{ minWidth: 130 }}
        >
          <MenuItem value="">Tutti</MenuItem>
          {TRIAGE_OPTIONS.map((t) => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </TextField>
        {hasActiveFilters && (
          <Button
            size="small"
            color="inherit"
            startIcon={<FilterAltOffIcon />}
            onClick={handleClearFilters}
          >
            Azzera filtri
          </Button>
        )}

        {/* Ordinamento + scelta vista, allineati a destra. */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: { md: "auto" } }}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={view}
            onChange={(_, v: ViewMode | null) => changeView(v)}
          >
            <ToggleButton value="list" aria-label="Vista lista">
              <ViewListIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="grid" aria-label="Vista griglia">
              <ViewModuleIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Paper>

      {showSkeleton ? (
        <Stack spacing={1}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={64} />
          ))}
        </Stack>
      ) : items.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <Box sx={{ color: "text.disabled", mb: 1.5, "& svg": { fontSize: 64 } }}>
            {hasActiveFilters ? <SearchOffIcon /> : <InboxIcon />}
          </Box>
          <Typography color="text.secondary">
            {hasActiveFilters
              ? "Nessuna scheda corrisponde ai filtri."
              : "Nessuna scheda. Crea la prima con “Nuova scheda”."}
          </Typography>
        </Paper>
      ) : view === "list" ? (
        <>
          <Stack spacing={1} sx={fadeSx}>
            {items.map((scheda) => (
              <Paper
                key={scheda.id}
                elevation={1}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 2,
                  py: 1.25,
                  transition: "box-shadow 0.15s, transform 0.15s",
                  "&:hover": { boxShadow: 4, transform: "translateY(-1px)" },
                }}
              >
                <TriageChip value={scheda.codiceTriage} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    component={Link}
                    href={`/schede/${scheda.id}`}
                    noWrap
                    sx={{
                      display: "block",
                      color: "primary.main",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    {etichettaScheda(scheda)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {rigaSecondaria(scheda)}
                  </Typography>
                </Box>
                <StatusChip status={scheda.status} />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ whiteSpace: "nowrap", display: { xs: "none", md: "block" } }}
                >
                  {format(new Date(scheda.updatedAt), "d MMM yyyy, HH:mm", { locale: it })}
                </Typography>
                <Tooltip title="Sposta nel cestino">
                  <IconButton
                    size="small"
                    onClick={() => setToDelete(scheda)}
                    aria-label="Elimina scheda"
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Paper>
            ))}
          </Stack>
          {pagination}
        </>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fill, minmax(260px, 1fr))" },
              gap: 2,
              ...fadeSx,
            }}
          >
            {items.map((scheda) => (
              <Card
                key={scheda.id}
                variant="outlined"
                sx={{
                  transition: "box-shadow 0.15s, transform 0.15s",
                  "&:hover": { boxShadow: 3, transform: "translateY(-1px)" },
                }}
              >
                <CardContent sx={{ pb: 1.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        component={Link}
                        href={`/schede/${scheda.id}`}
                        sx={{
                          color: "primary.main",
                          textDecoration: "none",
                          fontWeight: 600,
                          display: "block",
                        }}
                      >
                        {etichettaScheda(scheda)}
                      </Typography>
                      {riferimentoSecondario(scheda) && (
                        <Typography variant="caption" color="text.secondary">
                          Rif. {riferimentoSecondario(scheda)}
                        </Typography>
                      )}
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => setToDelete(scheda)}
                      aria-label="Elimina scheda"
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", my: 1 }}>
                    <StatusChip status={scheda.status} />
                    <TriageChip value={scheda.codiceTriage} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {riepilogoSintomi(scheda.sintomi)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Aggiornata il{" "}
                    {format(new Date(scheda.updatedAt), "d MMM yyyy, HH:mm", { locale: it })}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
          {pagination}
        </>
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
