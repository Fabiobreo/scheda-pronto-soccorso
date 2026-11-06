"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { GCS_COMPONENTI, calcolaGcs, interpretaGcs } from "@/lib/trauma";

export interface GcsComponenti {
  gcsE: string;
  gcsV: string;
  gcsM: string;
}

// Calcolatore Glasgow Coma Scale: un menù a tendina per componente (E/V/M),
// il totale viene riportato nella colonna GCS della riga parametri.
export default function GcsDialog({
  open,
  initial,
  onClose,
  onConfirm,
}: {
  open: boolean;
  initial: GcsComponenti;
  onClose: () => void;
  onConfirm: (value: GcsComponenti) => void;
}) {
  const [value, setValue] = useState<GcsComponenti>(initial);
  const totale = calcolaGcs(value);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      // Ad ogni apertura riparte dai valori salvati della riga.
      slotProps={{ transition: { onEnter: () => setValue(initial) } }}
    >
      <DialogTitle>Glasgow Coma Scale</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {GCS_COMPONENTI.map((comp) => (
            <TextField
              key={comp.campo}
              select
              label={`${comp.label} (${comp.sigla})`}
              value={value[comp.campo]}
              onChange={(e) => setValue((v) => ({ ...v, [comp.campo]: e.target.value }))}
              size="small"
              fullWidth
            >
              <MenuItem value="">
                <em>—</em>
              </MenuItem>
              {comp.voci.map((voce) => (
                <MenuItem key={voce.punti} value={String(voce.punti)}>
                  {voce.punti} – {voce.label}
                </MenuItem>
              ))}
            </TextField>
          ))}
          <Typography sx={{ fontWeight: 700 }}>
            {totale !== null
              ? `GCS ${totale} (E${value.gcsE} V${value.gcsV} M${value.gcsM}) – ${interpretaGcs(totale)}`
              : "Seleziona le tre voci per ottenere il totale"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Grave ≤ 8 · Moderata 9-13 · Minore ≥ 14
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button variant="contained" disabled={totale === null} onClick={() => onConfirm(value)}>
          Inserisci
        </Button>
      </DialogActions>
    </Dialog>
  );
}
