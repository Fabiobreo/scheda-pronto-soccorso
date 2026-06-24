"use client";

import { memo } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import TextField from "@mui/material/TextField";
import { CATEGORIE_SINTOMI } from "@/lib/sintomi";
import type { CategoriaSelezione, Sintomi } from "@/lib/schemas/scheda";

const EMPTY_SEL: CategoriaSelezione = { codici: [], note: "" };

function SintomiSection({
  value,
  onChange,
}: {
  value: Sintomi;
  onChange: (next: Sintomi) => void;
}) {
  const update = (catId: string, sel: CategoriaSelezione) => {
    onChange({ ...value, [catId]: sel });
  };

  const toggleCodice = (catId: string, codice: string, checked: boolean) => {
    const sel = value[catId] ?? EMPTY_SEL;
    const codici = checked ? [...sel.codici, codice] : sel.codici.filter((c) => c !== codice);
    update(catId, { ...sel, codici });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {CATEGORIE_SINTOMI.map((cat) => {
        const sel = value[cat.id] ?? EMPTY_SEL;
        return (
          <Paper key={cat.id} variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h3" sx={{ mb: 1 }}>
              {cat.label}
            </Typography>
            {cat.voci.length > 0 && (
              <FormGroup
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
                }}
              >
                {cat.voci.map((voce) => (
                  <FormControlLabel
                    key={voce.codice}
                    control={
                      <Checkbox
                        size="small"
                        checked={sel.codici.includes(voce.codice)}
                        onChange={(e) => toggleCodice(cat.id, voce.codice, e.target.checked)}
                      />
                    }
                    label={voce.label}
                  />
                ))}
              </FormGroup>
            )}
            {cat.conNote && (
              <TextField
                label={cat.voci.length > 0 ? "Altro / note" : "Descrizione"}
                value={sel.note}
                onChange={(e) => update(cat.id, { ...sel, note: e.target.value })}
                fullWidth
                multiline
                minRows={1}
                size="small"
                sx={{ mt: cat.voci.length > 0 ? 1.5 : 0 }}
              />
            )}
          </Paper>
        );
      })}
    </Box>
  );
}

export default memo(SintomiSection);
