"use client";

import { memo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import InputAdornment from "@mui/material/InputAdornment";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import GcsDialog, { type GcsComponenti } from "@/components/scheda/GcsDialog";
import { interpretaGcs, interpretaRts, normalizzaParametro, parseGcs } from "@/lib/trauma";
import { PARAMETRI_COLONNE } from "@/lib/sintomi";
import { emptyParametro } from "@/lib/scheda";
import { nowDate, nowTime } from "@/lib/time";
import type { ParametroVitale } from "@/lib/schemas/scheda";

type Campo = (typeof PARAMETRI_COLONNE)[number]["campo"];

function ParametriTable({
  value,
  onChange,
}: {
  value: ParametroVitale[];
  onChange: (next: ParametroVitale[]) => void;
}) {
  // Indice della riga di cui si sta compilando la GCS (null = dialog chiuso).
  const [gcsRow, setGcsRow] = useState<number | null>(null);

  // GCS (da E/V/M) e RTS sono derivati: si ricalcolano a ogni modifica della riga.
  // rts azzerato prima del ricalcolo, così si svuota se GCS/PA/FR diventano incompleti.
  const updateRow = (index: number, patch: Partial<ParametroVitale>) => {
    onChange(
      value.map((row, i) =>
        i === index ? normalizzaParametro({ ...row, ...patch, rts: "" }) : row
      )
    );
  };

  const updateCell = (index: number, campo: Campo, val: string) => {
    // GCS scritta a mano: le componenti E/V/M non sono più coerenti, si azzerano.
    if (campo === "gcs") updateRow(index, { gcs: val, gcsE: "", gcsV: "", gcsM: "" });
    else updateRow(index, { [campo]: val });
  };

  const confirmGcs = (c: GcsComponenti) => {
    if (gcsRow !== null) updateRow(gcsRow, c);
    setGcsRow(null);
  };

  const addRow = () =>
    onChange([...value, { ...emptyParametro(), data: nowDate(), ora: nowTime() }]);
  const removeRow = (index: number) => onChange(value.filter((_, i) => i !== index));

  return (
    <Box>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              {PARAMETRI_COLONNE.map((col) => (
                <TableCell key={col.campo} sx={{ fontWeight: 700 }}>
                  {col.label}
                </TableCell>
              ))}
              <TableCell padding="checkbox" sx={{ displayPrint: "none" }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {value.map((row, index) => (
              <TableRow key={index}>
                {PARAMETRI_COLONNE.map((col) => (
                  <TableCell key={col.campo} sx={{ p: 0.5 }}>
                    {col.campo === "rts" ? (
                      <RtsCell rts={row.rts} />
                    ) : (
                      <TextField
                        value={row[col.campo]}
                        onChange={(e) => updateCell(index, col.campo, e.target.value)}
                        variant="standard"
                        size="small"
                        type={col.campo === "data" ? "date" : "text"}
                        sx={{
                          minWidth:
                            col.campo === "data"
                              ? 128
                              : col.campo === "gcs"
                                ? 84
                                : col.campo === "ora"
                                  ? 64
                                  : 52,
                        }}
                        slotProps={
                          col.campo === "gcs"
                            ? {
                                input: {
                                  title: gcsTitle(row),
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <Tooltip title="Calcola Glasgow Coma Scale">
                                        <IconButton
                                          size="small"
                                          edge="end"
                                          onClick={() => setGcsRow(index)}
                                          aria-label="Calcola Glasgow Coma Scale"
                                          sx={{ displayPrint: "none" }}
                                        >
                                          <CalculateOutlinedIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </InputAdornment>
                                  ),
                                },
                              }
                            : undefined
                        }
                      />
                    )}
                  </TableCell>
                ))}
                <TableCell padding="checkbox" sx={{ displayPrint: "none" }}>
                  <IconButton
                    size="small"
                    onClick={() => removeRow(index)}
                    aria-label="Rimuovi rilevazione"
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Button
        startIcon={<AddIcon />}
        onClick={addRow}
        size="small"
        sx={{ mt: 1, displayPrint: "none" }}
      >
        Aggiungi rilevazione
      </Button>
      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.5 }}>
        RTS calcolato in automatico da GCS, PA sistolica e FR (12 differibile · 11 urgente · 3-10
        immediato).
      </Typography>
      <GcsDialog
        open={gcsRow !== null}
        initial={
          gcsRow !== null && value[gcsRow]
            ? { gcsE: value[gcsRow].gcsE, gcsV: value[gcsRow].gcsV, gcsM: value[gcsRow].gcsM }
            : { gcsE: "", gcsV: "", gcsM: "" }
        }
        onClose={() => setGcsRow(null)}
        onConfirm={confirmGcs}
      />
    </Box>
  );
}

function gcsTitle(row: ParametroVitale): string | undefined {
  const gcs = parseGcs(row.gcs);
  if (gcs === null) return undefined;
  const comp = row.gcsE && row.gcsV && row.gcsM ? ` (E${row.gcsE} V${row.gcsV} M${row.gcsM})` : "";
  return `GCS ${gcs}${comp} – ${interpretaGcs(gcs)}`;
}

// RTS in sola lettura: è sempre derivato da GCS, PA e FR della riga.
function RtsCell({ rts }: { rts: string }) {
  const n = /^\d{1,2}$/.test(rts) ? Number(rts) : null;
  return (
    <Tooltip title={n !== null ? interpretaRts(n) : "Compila GCS, PA e FR"}>
      <Typography
        variant="body2"
        sx={{ minWidth: 40, px: 0.5, fontWeight: n !== null ? 700 : 400 }}
        color={n !== null ? "text.primary" : "text.secondary"}
      >
        {rts || "—"}
      </Typography>
    </Tooltip>
  );
}

export default memo(ParametriTable);
