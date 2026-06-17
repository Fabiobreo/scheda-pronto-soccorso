"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { emptyVoceDiario } from "@/lib/scheda";
import type { VoceDiario } from "@/lib/schemas/scheda";

export default function DiarioSection({
  value,
  onChange,
}: {
  value: VoceDiario[];
  onChange: (next: VoceDiario[]) => void;
}) {
  const update = (index: number, patch: Partial<VoceDiario>) => {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };
  const addRow = () => onChange([...value, emptyVoceDiario()]);
  const removeRow = (index: number) => onChange(value.filter((_, i) => i !== index));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {value.map((row, index) => (
        <Paper key={index} variant="outlined" sx={{ p: 1.5, display: "flex", gap: 1 }}>
          <TextField
            label="Ora"
            value={row.ora}
            onChange={(e) => update(index, { ora: e.target.value })}
            size="small"
            sx={{ width: 90, flexShrink: 0 }}
          />
          <TextField
            label="Annotazione"
            value={row.testo}
            onChange={(e) => update(index, { testo: e.target.value })}
            size="small"
            fullWidth
            multiline
            minRows={1}
          />
          <IconButton
            onClick={() => removeRow(index)}
            aria-label="Rimuovi annotazione"
            sx={{ displayPrint: "none", alignSelf: "flex-start" }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Paper>
      ))}
      <Button
        startIcon={<AddIcon />}
        onClick={addRow}
        size="small"
        sx={{ alignSelf: "flex-start", displayPrint: "none" }}
      >
        Aggiungi annotazione
      </Button>
    </Box>
  );
}
