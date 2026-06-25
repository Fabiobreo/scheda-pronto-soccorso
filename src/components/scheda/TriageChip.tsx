import Chip from "@mui/material/Chip";
import type { TriageKey } from "@/theme";

// Normalizza l'etichetta del triage (es. "Rosso") nella chiave della palette.
// Ritorna null se il valore non è un codice triage noto (campo vuoto, ecc.).
const TRIAGE_KEYS: TriageKey[] = ["rosso", "arancione", "azzurro", "verde", "bianco"];

export function triageKey(value: string): TriageKey | null {
  const k = value.trim().toLowerCase();
  return (TRIAGE_KEYS as string[]).includes(k) ? (k as TriageKey) : null;
}

export default function TriageChip({ value, size = "small" }: { value: string; size?: "small" | "medium" }) {
  const key = triageKey(value);
  if (!key) return null;

  return (
    <Chip
      size={size}
      label={value}
      sx={{
        bgcolor: (theme) => theme.palette.triage[key].main,
        color: (theme) => theme.palette.triage[key].contrastText,
        fontWeight: 600,
        // Bordo per il triage "Bianco" (grigio chiaro), poco distinguibile dallo sfondo.
        border: (theme) => (key === "bianco" ? `1px solid ${theme.palette.divider}` : "none"),
      }}
    />
  );
}
