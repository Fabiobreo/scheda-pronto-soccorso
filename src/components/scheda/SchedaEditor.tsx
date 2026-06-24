"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PrintIcon from "@mui/icons-material/Print";
import Section from "@/components/scheda/Section";
import SaveIndicator, { type SaveStatus } from "@/components/scheda/SaveIndicator";
import SintomiSection from "@/components/scheda/SintomiSection";
import PatologieSelect from "@/components/scheda/PatologieSelect";
import ParametriTable from "@/components/scheda/ParametriTable";
import TerapieSection from "@/components/scheda/TerapieSection";
import DiarioSection from "@/components/scheda/DiarioSection";
import { useUpdateScheda } from "@/hooks/useSchede";
import { useToast } from "@/context/ToastContext";
import type { SchedaContent, SchedaDTO } from "@/lib/scheda";
import type {
  ParametroVitale,
  Sintomi,
  TerapiaSomministrata,
  VoceDiario,
} from "@/lib/schemas/scheda";

const AUTOSAVE_DELAY_MS = 1000;

const SESSO_OPTIONS = ["M", "F", "Altro"];
const TRIAGE_OPTIONS = ["Rosso", "Arancione", "Azzurro", "Verde", "Bianco"];
const GRUPPO_OPTIONS = ["0+", "0-", "A+", "A-", "B+", "B-", "AB+", "AB-", "Sconosciuto"];
const COSCIENZA_OPTIONS = [
  "Vigile",
  "Agitato/Disorientato",
  "Reagisce Se Chiamato",
  "Reagisce Al Dolore",
  "Privo Di Conoscenza",
];
const RESPIRO_OPTIONS = ["Normale", "Tachipnea", "Dispnea", "Assente"];
const ADDOME_OPTIONS = ["Trattabile", "Dolente", "Vomito", "Diarrea"];
const CIRCOLO_OPTIONS = [
  "Presente",
  "Tachicardia",
  "Bradicardia",
  "Sudorazione",
  "Pallore Cutaneo",
  "Dolore Toracico",
  "Assente",
];
const VIE_AEREE_OPTIONS = ["Libere", "Ostruite"];

// I campi della valutazione ABCDE sono String nel DB: le scelte multiple
// vengono serializzate con questo separatore (assente nelle label) e
// ri-splittate per la UI.
const MULTI_SEP = " · ";
const splitMulti = (v: string) => (v ? v.split(MULTI_SEP) : []);

// sx riutilizzabile per la griglia responsive dei campi.
const gridSx = {
  display: "grid",
  gap: 2,
  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
} as const;

// Label "shrink" forzata per gli input nativi date/time (altrimenti si sovrappone).
const shrinkLabel = { inputLabel: { shrink: true } } as const;
// sx hoistati a costanti: se fossero inline (nuovo oggetto a ogni render)
// vanificherebbero il memo dei campi che li ricevono.
const riferimentoSx = { minWidth: 280 } as const;
const negaFieldSx = { mt: 1 } as const;
const patologieBoxSx = { mt: 2 } as const;

// Campo di testo memoizzato: si ri-renderizza solo quando cambia il SUO valore
// (richiede onChange referenzialmente stabile — vedi le factory di setter).
const MemoTextField = memo(function MemoTextField({
  value,
  onChange,
  ...rest
}: { value: string; onChange: (v: string) => void } & Omit<
  TextFieldProps,
  "value" | "onChange"
>) {
  return <TextField value={value} onChange={(e) => onChange(e.target.value)} {...rest} />;
});

// Select singola memoizzata (con voce vuota "—").
const MemoSelectField = memo(function MemoSelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <TextField
      select
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      size="small"
    >
      <MenuItem value="">
        <em>—</em>
      </MenuItem>
      {options.map((o) => (
        <MenuItem key={o} value={o}>
          {o}
        </MenuItem>
      ))}
    </TextField>
  );
});

// Sezione "Nega … / testo libero" memoizzata (terapia domiciliare, allergie).
const MemoNegaField = memo(function MemoNegaField({
  checkboxLabel,
  nega,
  onNegaChange,
  value,
  onValueChange,
  minRows,
}: {
  checkboxLabel: string;
  nega: boolean;
  onNegaChange: (v: boolean) => void;
  value: string;
  onValueChange: (v: string) => void;
  minRows: number;
}) {
  return (
    <>
      <FormControlLabel
        control={<Checkbox checked={nega} onChange={(e) => onNegaChange(e.target.checked)} />}
        label={checkboxLabel}
      />
      <TextField
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        fullWidth
        multiline
        minRows={minRows}
        disabled={nega}
        sx={negaFieldSx}
      />
    </>
  );
});

// Select a scelta multipla: ogni voce scelta appare come chip rimovibile.
// Serializza/deserializza una stringa separata da MULTI_SEP.
const MultiChipSelect = memo(function MultiChipSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (next: string) => void;
}) {
  const selected = splitMulti(value);
  return (
    <TextField
      select
      label={label}
      value={selected}
      onChange={(e) => onChange((e.target.value as unknown as string[]).join(MULTI_SEP))}
      size="small"
      slotProps={{
        select: {
          multiple: true,
          renderValue: (raw) => (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {(raw as string[]).map((v) => (
                <Chip
                  key={v}
                  label={v}
                  size="small"
                  onMouseDown={(e) => e.stopPropagation()}
                  onDelete={() => onChange(selected.filter((x) => x !== v).join(MULTI_SEP))}
                />
              ))}
            </Box>
          ),
        },
      }}
    >
      {options.map((o) => (
        <MenuItem key={o} value={o}>
          {o}
        </MenuItem>
      ))}
    </TextField>
  );
});

function toContent(dto: SchedaDTO): SchedaContent {
  const { id, status, createdAt, updatedAt, completedAt, ...content } = dto;
  void id;
  void status;
  void createdAt;
  void updatedAt;
  void completedAt;
  return content;
}

export default function SchedaEditor({ scheda }: { scheda: SchedaDTO }) {
  const router = useRouter();
  const { showToast } = useToast();
  const update = useUpdateScheda(scheda.id);

  const [content, setContent] = useState<SchedaContent>(() => toContent(scheda));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const lastSavedRef = useRef<string>(JSON.stringify(toContent(scheda)));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Riferimenti stabili alle dipendenze usate dentro l'effetto di autosave,
  // così l'effetto dipende solo da `content` (useMutation cambia ogni render).
  const mutateRef = useRef(update.mutate);
  const toastRef = useRef(showToast);
  useEffect(() => {
    mutateRef.current = update.mutate;
    toastRef.current = showToast;
  });

  // Autosave debounced: salva l'intero contenuto dopo l'inattività.
  useEffect(() => {
    const serialized = JSON.stringify(content);
    if (serialized === lastSavedRef.current) return;

    setSaveStatus("pending");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSaveStatus("saving");
      mutateRef.current(content, {
        onSuccess: () => {
          lastSavedRef.current = serialized;
          setSaveStatus("saved");
        },
        onError: (e: Error) => {
          setSaveStatus("error");
          toastRef.current(e.message, "error");
        },
      });
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [content]);

  // Stabile (nessuna dipendenza): usa l'updater funzionale, così le callback
  // derivate restano referenzialmente costanti e i sotto-componenti memoizzati
  // non si ri-renderizzano a ogni battitura su altri campi.
  const setField = useCallback(<K extends keyof SchedaContent>(key: K, val: SchedaContent[K]) => {
    setContent((prev) => ({ ...prev, [key]: val }));
  }, []);

  // Handler stabili per le sezioni "pesanti" (liste/checkbox/modale): senza
  // questi, le closure inline vanificherebbero il memo dei componenti figli.
  const setSintomi = useCallback((v: Sintomi) => setField("sintomi", v), [setField]);
  const setPatologie = useCallback((v: string[]) => setField("patologie", v), [setField]);
  const setParametri = useCallback((v: ParametroVitale[]) => setField("parametri", v), [setField]);
  const setTerapie = useCallback(
    (v: TerapiaSomministrata[]) => setField("terapieSomministrate", v),
    [setField]
  );
  const setDiario = useCallback((v: VoceDiario[]) => setField("diario", v), [setField]);

  // Factory di setter stabili per chiave: restituisce SEMPRE la stessa funzione
  // per una data chiave, così ogni MemoTextField/MemoSelectField si ri-renderizza
  // solo quando cambia il proprio valore (e non a ogni battitura su altri campi).
  type StringKey = {
    [K in keyof SchedaContent]: SchedaContent[K] extends string ? K : never;
  }[keyof SchedaContent];
  type BoolKey = {
    [K in keyof SchedaContent]: SchedaContent[K] extends boolean ? K : never;
  }[keyof SchedaContent];

  const strSetter = useMemo(() => {
    const cache = new Map<StringKey, (v: string) => void>();
    return (key: StringKey) => {
      let fn = cache.get(key);
      if (!fn) {
        fn = (v: string) => setContent((prev) => ({ ...prev, [key]: v }));
        cache.set(key, fn);
      }
      return fn;
    };
  }, []);

  const boolSetter = useMemo(() => {
    const cache = new Map<BoolKey, (v: boolean) => void>();
    return (key: BoolKey) => {
      let fn = cache.get(key);
      if (!fn) {
        fn = (v: boolean) => setContent((prev) => ({ ...prev, [key]: v }));
        cache.set(key, fn);
      }
      return fn;
    };
  }, []);

  const handleComplete = () => {
    setConfirmOpen(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    setSaveStatus("saving");
    mutateRef.current(
      { ...content, status: "COMPLETED" },
      {
        onSuccess: () => {
          lastSavedRef.current = JSON.stringify(content);
          showToast("Scheda completata", "success");
          router.refresh();
        },
        onError: (e: Error) => {
          setSaveStatus("error");
          showToast(e.message, "error");
        },
      }
    );
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <MemoTextField
          label="Riferimento (iniziali / codice intervento)"
          value={content.riferimento}
          onChange={strSetter("riferimento")}
          size="small"
          sx={riferimentoSx}
        />
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <SaveIndicator status={saveStatus} />
          <Link href={`/schede/${scheda.id}/stampa`} target="_blank">
            <Button variant="outlined" startIcon={<PrintIcon />}>
              Stampa
            </Button>
          </Link>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => setConfirmOpen(true)}
            disabled={update.isPending}
          >
            Completa
          </Button>
        </Box>
      </Box>

      <Section title="Dati paziente">
        <Box sx={gridSx}>
          <MemoTextField
            label="Data"
            type="date"
            value={content.data}
            onChange={strSetter("data")}
            size="small"
            slotProps={shrinkLabel}
          />
          <MemoTextField
            label="Ora arrivo"
            type="time"
            value={content.oraArrivo}
            onChange={strSetter("oraArrivo")}
            size="small"
            slotProps={shrinkLabel}
          />
          <MemoTextField
            label="Ora inizio trattamento"
            type="time"
            value={content.oraInizioTrattamento}
            onChange={strSetter("oraInizioTrattamento")}
            size="small"
            slotProps={shrinkLabel}
          />
          <MemoTextField
            label="Cognome"
            value={content.cognome}
            onChange={strSetter("cognome")}
            size="small"
          />
          <MemoTextField
            label="Nome"
            value={content.nome}
            onChange={strSetter("nome")}
            size="small"
          />
          <MemoTextField
            label="Data di nascita"
            type="date"
            value={content.dataNascita}
            onChange={strSetter("dataNascita")}
            size="small"
            slotProps={shrinkLabel}
          />
          <MemoSelectField
            label="Sesso"
            value={content.sesso}
            onChange={strSetter("sesso")}
            options={SESSO_OPTIONS}
          />
          <MemoTextField
            label="Telefono"
            type="tel"
            value={content.telefono}
            onChange={strSetter("telefono")}
            size="small"
          />
          <MemoSelectField
            label="Gruppo"
            value={content.gruppo}
            onChange={strSetter("gruppo")}
            options={GRUPPO_OPTIONS}
          />
          <MemoSelectField
            label="Codice triage"
            value={content.codiceTriage}
            onChange={strSetter("codiceTriage")}
            options={TRIAGE_OPTIONS}
          />
          <MemoTextField
            label="Responsabile"
            value={content.responsabile}
            onChange={strSetter("responsabile")}
            size="small"
          />
        </Box>
      </Section>

      <Section title="Valutazione iniziale">
        <Box sx={gridSx}>
          <MultiChipSelect
            label="Coscienza"
            value={content.coscienza}
            options={COSCIENZA_OPTIONS}
            onChange={strSetter("coscienza")}
          />
          <MemoSelectField
            label="Vie aeree"
            value={content.vieAeree}
            onChange={strSetter("vieAeree")}
            options={VIE_AEREE_OPTIONS}
          />
          <MultiChipSelect
            label="Respiro"
            value={content.respiro}
            options={RESPIRO_OPTIONS}
            onChange={strSetter("respiro")}
          />
          <MultiChipSelect
            label="Circolo"
            value={content.circolo}
            options={CIRCOLO_OPTIONS}
            onChange={strSetter("circolo")}
          />
          <MultiChipSelect
            label="Addome"
            value={content.addome}
            options={ADDOME_OPTIONS}
            onChange={strSetter("addome")}
          />
        </Box>
        <Box sx={patologieBoxSx}>
          <PatologieSelect value={content.patologie} onChange={setPatologie} />
        </Box>
      </Section>

      <Section title="Sintomi (SAMPLE)">
        <SintomiSection value={content.sintomi} onChange={setSintomi} />
      </Section>

      <Section title="Monitoraggio parametri">
        <ParametriTable value={content.parametri} onChange={setParametri} />
      </Section>

      <Section title="Anamnesi">
        <MemoTextField
          value={content.anamnesi}
          onChange={strSetter("anamnesi")}
          fullWidth
          multiline
          minRows={3}
        />
      </Section>

      <Section title="Terapia domiciliare">
        <MemoNegaField
          checkboxLabel="Nega terapia domiciliare"
          nega={content.negaTerapiaDomiciliare}
          onNegaChange={boolSetter("negaTerapiaDomiciliare")}
          value={content.terapiaDomiciliare}
          onValueChange={strSetter("terapiaDomiciliare")}
          minRows={2}
        />
      </Section>

      <Section title="Allergie">
        <MemoNegaField
          checkboxLabel="Nega allergie"
          nega={content.negaAllergie}
          onNegaChange={boolSetter("negaAllergie")}
          value={content.allergie}
          onValueChange={strSetter("allergie")}
          minRows={2}
        />
      </Section>

      <Section title="Terapia somministrata">
        <TerapieSection value={content.terapieSomministrate} onChange={setTerapie} />
      </Section>

      <Section title="Diario clinico">
        <DiarioSection value={content.diario} onChange={setDiario} />
      </Section>

      <Section title="Conclusioni e indicazioni">
        <MemoTextField
          value={content.conclusioni}
          onChange={strSetter("conclusioni")}
          fullWidth
          multiline
          minRows={3}
        />
      </Section>

      <Section title="Esito">
        <MemoTextField
          value={content.esito}
          onChange={strSetter("esito")}
          fullWidth
          multiline
          minRows={2}
        />
      </Section>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Completare la scheda?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Una volta completata, la scheda diventa di sola lettura: potrai visualizzarla e
            stamparla, ma non modificarla.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Annulla</Button>
          <Button color="success" variant="contained" onClick={handleComplete}>
            Completa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
