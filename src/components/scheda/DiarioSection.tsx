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
import { nowDate, nowTime } from "@/lib/time";
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
  // Nuova riga con data e ora correnti già compilate (caso d'uso più comune sul campo).
  const addRow = () =>
    onChange([...value, { ...emptyVoceDiario(), data: nowDate(), ora: nowTime() }]);
  const removeRow = (index: number) => onChange(value.filter((_, i) => i !== index));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {value.map((row, index) => (
        <Paper
          key={index}
          variant="outlined"
          sx={{ p: 1.5, display: "flex", flexWrap: { xs: "wrap", sm: "nowrap" }, gap: 1 }}
        >
          <TextField
            label="Data"
            type="date"
            value={row.data}
            onChange={(e) => update(index, { data: e.target.value })}
            size="small"
            sx={{ width: 160, flexShrink: 0 }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
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
                    <Tooltip title="Imposta data e ora correnti">
                      <IconButton
                        size="small"
                        edge="end"
                        onClick={() => update(index, { data: nowDate(), ora: nowTime() })}
                        aria-label="Imposta data e ora correnti"
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
