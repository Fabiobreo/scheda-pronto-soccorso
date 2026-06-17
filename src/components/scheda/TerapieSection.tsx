"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { emptyTerapia } from "@/lib/scheda";
import type { TerapiaSomministrata } from "@/lib/schemas/scheda";

export default function TerapieSection({
  value,
  onChange,
}: {
  value: TerapiaSomministrata[];
  onChange: (next: TerapiaSomministrata[]) => void;
}) {
  const update = (index: number, patch: Partial<TerapiaSomministrata>) => {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };
  const addRow = () => onChange([...value, emptyTerapia()]);
  const removeRow = (index: number) => onChange(value.filter((_, i) => i !== index));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {value.map((row, index) => (
        <Paper key={index} variant="outlined" sx={{ p: 1.5 }}>
          <Box
            sx={{
              display: "grid",
              gap: 1,
              gridTemplateColumns: { xs: "1fr", sm: "auto 1fr 1fr auto auto" },
              alignItems: "center",
            }}
          >
            <TextField
              label="Ora"
              value={row.ora}
              onChange={(e) => update(index, { ora: e.target.value })}
              size="small"
              sx={{ width: { sm: 90 } }}
            />
            <TextField
              label="Farmaco"
              value={row.farmaco}
              onChange={(e) => update(index, { farmaco: e.target.value })}
              size="small"
            />
            <TextField
              label="Dose"
              value={row.dose}
              onChange={(e) => update(index, { dose: e.target.value })}
              size="small"
            />
            <TextField
              label="Via"
              value={row.via}
              onChange={(e) => update(index, { via: e.target.value })}
              size="small"
              sx={{ width: { sm: 110 } }}
            />
            <IconButton
              onClick={() => removeRow(index)}
              aria-label="Rimuovi terapia"
              sx={{ displayPrint: "none", justifySelf: "end" }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
          <TextField
            label="Note"
            value={row.note}
            onChange={(e) => update(index, { note: e.target.value })}
            size="small"
            fullWidth
            sx={{ mt: 1 }}
          />
        </Paper>
      ))}
      <Button
        startIcon={<AddIcon />}
        onClick={addRow}
        size="small"
        sx={{ alignSelf: "flex-start", displayPrint: "none" }}
      >
        Aggiungi terapia
      </Button>
    </Box>
  );
}
