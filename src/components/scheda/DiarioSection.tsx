"use client";

import { memo } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Tooltip from "@mui/material/Tooltip";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { emptyVoceDiario } from "@/lib/scheda";
import { nowTime } from "@/lib/time";
import type { VoceDiario } from "@/lib/schemas/scheda";

function DiarioSection({
  value,
  onChange,
}: {
  value: VoceDiario[];
  onChange: (next: VoceDiario[]) => void;
}) {
  const update = (index: number, patch: Partial<VoceDiario>) => {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };
  // Nuova riga con l'ora corrente già compilata (caso d'uso più comune sul campo).
  const addRow = () => onChange([...value, { ...emptyVoceDiario(), ora: nowTime() }]);
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
            sx={{ width: 120, flexShrink: 0 }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Imposta ora corrente">
                      <IconButton
                        size="small"
                        edge="end"
                        onClick={() => update(index, { ora: nowTime() })}
                        aria-label="Imposta ora corrente"
                        sx={{ displayPrint: "none" }}
                      >
                        <AccessTimeIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              },
            }}
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

export default memo(DiarioSection);
