"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
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
import ParametriTable from "@/components/scheda/ParametriTable";
import TerapieSection from "@/components/scheda/TerapieSection";
import DiarioSection from "@/components/scheda/DiarioSection";
import { useUpdateScheda } from "@/hooks/useSchede";
import { useToast } from "@/context/ToastContext";
import type { SchedaContent, SchedaDTO } from "@/lib/scheda";

const AUTOSAVE_DELAY_MS = 1000;

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

  const setField = <K extends keyof SchedaContent>(key: K, val: SchedaContent[K]) => {
    setContent((prev) => ({ ...prev, [key]: val }));
  };

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
        <TextField
          label="Riferimento (iniziali / codice intervento)"
          value={content.riferimento}
          onChange={(e) => setField("riferimento", e.target.value)}
          size="small"
          sx={{ minWidth: 280 }}
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

      <Section title="Sintomi (SAMPLE)">
        <SintomiSection value={content.sintomi} onChange={(v) => setField("sintomi", v)} />
      </Section>

      <Section title="Monitoraggio parametri">
        <ParametriTable value={content.parametri} onChange={(v) => setField("parametri", v)} />
      </Section>

      <Section title="Anamnesi">
        <TextField
          value={content.anamnesi}
          onChange={(e) => setField("anamnesi", e.target.value)}
          fullWidth
          multiline
          minRows={3}
        />
      </Section>

      <Section title="Terapia domiciliare">
        <FormControlLabel
          control={
            <Checkbox
              checked={content.negaTerapiaDomiciliare}
              onChange={(e) => setField("negaTerapiaDomiciliare", e.target.checked)}
            />
          }
          label="Nega terapia domiciliare"
        />
        <TextField
          value={content.terapiaDomiciliare}
          onChange={(e) => setField("terapiaDomiciliare", e.target.value)}
          fullWidth
          multiline
          minRows={2}
          disabled={content.negaTerapiaDomiciliare}
          sx={{ mt: 1 }}
        />
      </Section>

      <Section title="Allergie">
        <FormControlLabel
          control={
            <Checkbox
              checked={content.negaAllergie}
              onChange={(e) => setField("negaAllergie", e.target.checked)}
            />
          }
          label="Nega allergie"
        />
        <TextField
          value={content.allergie}
          onChange={(e) => setField("allergie", e.target.value)}
          fullWidth
          multiline
          minRows={2}
          disabled={content.negaAllergie}
          sx={{ mt: 1 }}
        />
      </Section>

      <Section title="Terapia somministrata">
        <TerapieSection
          value={content.terapieSomministrate}
          onChange={(v) => setField("terapieSomministrate", v)}
        />
      </Section>

      <Section title="Diario clinico">
        <DiarioSection value={content.diario} onChange={(v) => setField("diario", v)} />
      </Section>

      <Section title="Conclusioni e indicazioni">
        <TextField
          value={content.conclusioni}
          onChange={(e) => setField("conclusioni", e.target.value)}
          fullWidth
          multiline
          minRows={3}
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
