"use client";

import { memo, useMemo } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CalculateIcon from "@mui/icons-material/Calculate";
import TriageRisultato from "@/components/scheda/TriageRisultato";
import { calcolaTriage } from "@/lib/triage";
import {
  CODICI_VENETO,
  ISPETTIVI_VENETO,
  LAZIO_A_CODICE_SCHEDA,
  MOTIVI_PER_ID,
  MOTIVI_VENETO,
} from "@/lib/triage/tabelle";
import type { TriageInput } from "@/lib/schemas/triage";

// Calcolo del codice di triage (Lazio + Veneto) dentro la "Valutazione iniziale".
// Coscienza (→ AVPU), vie aeree e data di nascita NON si reinseriscono: arrivano
// dai campi della scheda. Il risultato qui è un'anteprima live; quello salvato lo
// ricalcola il server.

type NumKey = "spo2" | "fr" | "fc" | "pas" | "pad" | "tc" | "glicemia";
type FlagKey = {
  [K in keyof TriageInput]: TriageInput[K] extends boolean ? K : never;
}[keyof TriageInput];

const CAMPI_NUMERICI: { campo: NumKey; label: string }[] = [
  { campo: "spo2", label: "SpO2 (%)" },
  { campo: "fr", label: "FR (atti/min)" },
  { campo: "fc", label: "FC (b/m)" },
  { campo: "pas", label: "PA sistolica (mmHg)" },
  { campo: "pad", label: "PA diastolica (mmHg)" },
  { campo: "tc", label: "Temperatura (°C)" },
  { campo: "glicemia", label: "Glicemia HGT (mg/dl)" },
];

const GCS_OPTIONS = ["15", "14", "13", "12", "11", "10", "9", "8", "7", "6", "5", "4", "3"];
const DOLORE_OPTIONS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

const FLAG_PARAMETRI: { campo: FlagKey; label: string }[] = [
  { campo: "aritmia", label: "Aritmia di nuova insorgenza" },
  { campo: "polsiAssenti", label: "Polsi periferici assenti" },
  { campo: "febbreRiferita", label: "Febbre riferita" },
  { campo: "glicemiaHigh", label: "Glicemia: lettura “HIGH”" },
  { campo: "chetosi", label: "Sintomi/segni di chetosi" },
  {
    campo: "pluripatologico",
    label: "Pluripatologico / rischio sistemico (rilevante se > 75 anni)",
  },
];

const FLAG_PEDIATRICI: { campo: FlagKey; label: string }[] = [
  {
    campo: "pedInstabilitaAbc",
    label: "Instabilità fisiologica ABC (triage avanzato) → ROSSO Veneto",
  },
  { campo: "pewsCoscienza", label: "M-PEWS – Coscienza: irritato ma consolabile" },
  { campo: "pewsRespiro", label: "M-PEWS – Respiro: tachipnoico, retrazioni o SpO2 94-97%" },
  { campo: "pewsCircolo", label: "M-PEWS – Circolo: pallido o refill ≥3 s" },
  { campo: "pedImmunodepressione", label: "Immunodepressione (neutropenia, trapianto, steroidi)" },
  { campo: "pedCondizioniCompromesse", label: "Condizioni generali compromesse" },
  {
    campo: "pedSegniAllarme",
    label:
      "Segni di allarme: rash petecchiale/purpurico settico, rigidità nucale, fontanella bombata, stato soporoso → codice 1 Lazio",
  },
];

const gridSx = {
  display: "grid",
  gap: 2,
  gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr", md: "1fr 1fr 1fr 1fr" },
} as const;
const subtitleSx = { fontWeight: 700, mt: 3, mb: 1 } as const;
const shrinkLabel = { inputLabel: { shrink: true } } as const;

// Checkbox con barra colorata a sinistra (livello del discriminatore Veneto).
function VoceColorata({
  label,
  colore,
  checked,
  onChange,
}: {
  label: string;
  colore: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Box sx={{ borderLeft: 4, borderColor: `triage.${colore}.main`, pl: 1 }}>
      <FormControlLabel
        control={
          <Checkbox size="small" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        }
        label={<Typography variant="body2">{label}</Typography>}
      />
    </Box>
  );
}

function TriageCalculator({
  value,
  onChange,
  coscienza,
  vieAeree,
  dataNascita,
  data,
  codiceTriage,
  onApplicaCodice,
}: {
  value: TriageInput;
  onChange: (next: TriageInput) => void;
  coscienza: string;
  vieAeree: string;
  dataNascita: string;
  data: string;
  codiceTriage: string;
  onApplicaCodice: (codice: string) => void;
}) {
  const risultato = useMemo(
    () => calcolaTriage(value, { coscienza, vieAeree, dataNascita, data }),
    [value, coscienza, vieAeree, dataNascita, data]
  );
  const set = (patch: Partial<TriageInput>) => onChange({ ...value, ...patch });
  const toggle = (campo: "ispettivi" | "discriminatori", id: string, on: boolean) =>
    set({ [campo]: on ? [...value[campo], id] : value[campo].filter((x) => x !== id) });

  const motivo = MOTIVI_PER_ID[value.motivo];
  const suggerito = risultato.lazio ? LAZIO_A_CODICE_SCHEDA[risultato.lazio.codice] : null;
  const diverso =
    suggerito !== null &&
    codiceTriage !== "" &&
    codiceTriage.toLowerCase() !== suggerito.toLowerCase();

  const contesto = [
    risultato.eta !== null
      ? `Età ${risultato.eta} anni${risultato.pediatrico ? " (pediatrico)" : ""}`
      : "Età non calcolabile (manca la data di nascita)",
    `AVPU da “Coscienza”: ${risultato.avpu ?? "—"}`,
    `Vie aeree: ${vieAeree || "—"}`,
  ].join(" · ");

  return (
    <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: "divider" }}>
      <Typography variant="h3" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CalculateIcon fontSize="small" color="primary" /> Calcolo codice di triage
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {contesto}
      </Typography>

      <Box sx={gridSx}>
        <TextField
          label="Ora triage"
          type="time"
          value={value.ora}
          onChange={(e) => set({ ora: e.target.value })}
          size="small"
          slotProps={shrinkLabel}
        />
        {CAMPI_NUMERICI.map(({ campo, label }) => (
          <TextField
            key={campo}
            label={label}
            value={value[campo]}
            onChange={(e) => set({ [campo]: e.target.value })}
            size="small"
            slotProps={{ htmlInput: { inputMode: "decimal" } }}
          />
        ))}
        <TextField
          select
          label="GCS"
          value={value.gcs}
          onChange={(e) => set({ gcs: e.target.value })}
          size="small"
        >
          <MenuItem value="">
            <em>—</em>
          </MenuItem>
          {GCS_OPTIONS.map((o) => (
            <MenuItem key={o} value={o}>
              {o}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Dolore (0-10)"
          value={value.dolore}
          onChange={(e) => set({ dolore: e.target.value })}
          size="small"
        >
          <MenuItem value="">
            <em>—</em>
          </MenuItem>
          {DOLORE_OPTIONS.map((o) => (
            <MenuItem key={o} value={o}>
              {o}
            </MenuItem>
          ))}
        </TextField>
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: 2, mt: 1 }}>
        {FLAG_PARAMETRI.map(({ campo, label }) => (
          <FormControlLabel
            key={campo}
            control={
              <Checkbox
                size="small"
                checked={value[campo]}
                onChange={(e) => set({ [campo]: e.target.checked })}
              />
            }
            label={<Typography variant="body2">{label}</Typography>}
          />
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary">
        I parametri lasciati vuoti vengono ignorati. Il codice è il più grave tra quelli indicati
        dai parametri inseriti.
      </Typography>

      <Typography sx={subtitleSx}>Veneto – valutazione ispettiva in porta</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
        {ISPETTIVI_VENETO.map((v) => (
          <VoceColorata
            key={v.id}
            label={v.label}
            colore="rosso"
            checked={value.ispettivi.includes(v.id)}
            onChange={(on) => toggle("ispettivi", v.id, on)}
          />
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary">
        Qualsiasi segno spuntato definisce codice ROSSO. Una coscienza “Reagisce Se Chiamato” (V) dà
        GIALLO; se l’alterazione è rilevata ispettivamente in porta spuntare “Alterazione del
        sensorio”.
      </Typography>

      <Typography sx={subtitleSx}>Veneto – motivo di accesso e discriminatori</Typography>
      <TextField
        select
        label="Motivo di accesso"
        value={value.motivo}
        // Cambiando motivo i discriminatori del precedente non sono più validi.
        onChange={(e) => set({ motivo: e.target.value, discriminatori: [] })}
        size="small"
        fullWidth
      >
        <MenuItem value="">
          <em>— seleziona —</em>
        </MenuItem>
        {MOTIVI_VENETO.map((m) => (
          <MenuItem key={m.id} value={m.id}>
            {m.label}
          </MenuItem>
        ))}
      </TextField>
      {motivo && (
        <Box sx={{ mt: 1, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          {motivo.discriminatori.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Nessun discriminatore: codice {CODICI_VENETO[motivo.seNessuno].nome}.
            </Typography>
          )}
          {motivo.discriminatori.map((d) => (
            <VoceColorata
              key={d.id}
              label={d.label}
              colore={CODICI_VENETO[d.livello].colore}
              checked={value.discriminatori.includes(d.id)}
              onChange={(on) => toggle("discriminatori", d.id, on)}
            />
          ))}
        </Box>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
        Barra colorata: rosso = emergenza, giallo = rischio, verde = sofferenza.
      </Typography>

      {risultato.pediatrico && (
        <>
          <Typography sx={subtitleSx}>Parte pediatrica (età &lt; 18 anni)</Typography>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {FLAG_PEDIATRICI.map(({ campo, label }) => (
              <FormControlLabel
                key={campo}
                control={
                  <Checkbox
                    size="small"
                    checked={value[campo]}
                    onChange={(e) => set({ [campo]: e.target.checked })}
                  />
                }
                label={<Typography variant="body2">{label}</Typography>}
              />
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary">
            Dolore: scala FLACC (&lt;3 anni), Wong-Baker (3-8 anni), NRS (8-10 anni). PAS/PAD
            pediatriche non sono valutate. Soglie FR/FC pediatriche approssimate dai grafici del
            manuale.
          </Typography>
        </>
      )}

      {risultato.avvisi.length > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {risultato.avvisi.join(" · ")}
        </Alert>
      )}

      <Box sx={{ mt: 2 }}>
        <TriageRisultato risultato={risultato} />
      </Box>

      {suggerito && (
        <Box sx={{ mt: 1.5, display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => onApplicaCodice(suggerito)}
            disabled={codiceTriage.toLowerCase() === suggerito.toLowerCase()}
          >
            Usa codice Lazio “{suggerito}” come codice triage
          </Button>
          {diverso && (
            <Typography variant="body2" color="warning.main">
              Il codice triage della scheda ({codiceTriage}) è diverso da quello calcolato (
              {suggerito}).
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

export default memo(TriageCalculator);
