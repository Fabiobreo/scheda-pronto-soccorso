"use client";

import { memo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import { CATEGORIE_PATOLOGIE, LABEL_PER_CODICE } from "@/lib/patologie";

// Selettore della patologia prevalente: data l'ampiezza della tassonomia, le
// voci si scelgono in un modale (checkbox raggruppate per categoria); le voci
// selezionate restano visibili come chip rimovibili.
function PatologieSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  // Bozza locale: si applica solo alla conferma, così "Annulla" non sporca l'autosave.
  const [draft, setDraft] = useState<string[]>(value);

  const apri = () => {
    setDraft(value);
    setOpen(true);
  };

  const conferma = () => {
    onChange(draft);
    setOpen(false);
  };

  const toggle = (codice: string, checked: boolean) => {
    setDraft((prev) => (checked ? [...prev, codice] : prev.filter((c) => c !== codice)));
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 1 }}>
        <Typography sx={{ fontWeight: 700 }}>Patologia</Typography>
        <Button size="small" variant="outlined" onClick={apri}>
          {value.length > 0 ? "Modifica" : "Seleziona"}
        </Button>
      </Box>

      {value.length > 0 ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {value.map((codice) => (
            <Chip
              key={codice}
              label={`${codice} ${LABEL_PER_CODICE[codice] ?? "?"}`}
              size="small"
              onDelete={() => onChange(value.filter((c) => c !== codice))}
            />
          ))}
        </Box>
      ) : (
        <Typography color="text.secondary">Nessuna patologia selezionata</Typography>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Patologia</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {CATEGORIE_PATOLOGIE.map((cat) => (
              <Box key={cat.id}>
                <Typography variant="h3" sx={{ mb: 1 }}>
                  {cat.label}
                </Typography>
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
                          checked={draft.includes(voce.codice)}
                          onChange={(e) => toggle(voce.codice, e.target.checked)}
                        />
                      }
                      label={`${voce.codice} ${voce.label}`}
                    />
                  ))}
                </FormGroup>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Annulla</Button>
          <Button variant="contained" onClick={conferma}>
            Conferma
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default memo(PatologieSelect);
