"use client";

import { memo } from "react";
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
import { PARAMETRI_COLONNE } from "@/lib/sintomi";
import { emptyParametro } from "@/lib/scheda";
import { nowTime } from "@/lib/time";
import type { ParametroVitale } from "@/lib/schemas/scheda";

type Campo = (typeof PARAMETRI_COLONNE)[number]["campo"];

function ParametriTable({
  value,
  onChange,
}: {
  value: ParametroVitale[];
  onChange: (next: ParametroVitale[]) => void;
}) {
  const updateCell = (index: number, campo: Campo, val: string) => {
    onChange(value.map((row, i) => (i === index ? { ...row, [campo]: val } : row)));
  };

  const addRow = () => onChange([...value, { ...emptyParametro(), ora: nowTime() }]);
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
                    <TextField
                      value={row[col.campo]}
                      onChange={(e) => updateCell(index, col.campo, e.target.value)}
                      variant="standard"
                      size="small"
                      sx={{ minWidth: col.campo === "ora" ? 64 : 52 }}
                    />
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
    </Box>
  );
}

export default memo(ParametriTable);
