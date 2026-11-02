import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { CODICI_LAZIO, CODICI_VENETO, type DescrizioneCodice } from "@/lib/triage/tabelle";
import type { RisultatoTriage } from "@/lib/triage";
import type { TriageKey } from "@/theme";

// Risultato del calcolo del triage (Lazio + Veneto). Nessun handler né sx a
// funzione: è usato anche dalla vista in sola lettura (Server Component).
// I colori sono path della palette del tema (es. "triage.rosso.main").

interface Riga {
  livello: string | null;
  colore: TriageKey | null;
  voce: string;
  dettaglio: string;
}

function Badge({ livello, colore }: { livello: string | null; colore: TriageKey | null }) {
  return (
    <Box
      component="span"
      sx={{
        flexShrink: 0,
        minWidth: 24,
        height: 22,
        px: 0.5,
        borderRadius: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.75rem",
        fontWeight: 700,
        bgcolor: colore ? `triage.${colore}.main` : "transparent",
        color: colore ? `triage.${colore}.contrastText` : "text.secondary",
        border: 1,
        borderColor: colore && colore !== "bianco" ? "transparent" : "divider",
        printColorAdjust: "exact",
        WebkitPrintColorAdjust: "exact",
      }}
    >
      {livello ?? "–"}
    </Box>
  );
}

function Riquadro({
  modello,
  titolo,
  descrizione,
  righe,
}: {
  modello: string;
  titolo: string | null;
  descrizione: DescrizioneCodice | null;
  righe: Riga[];
}) {
  const colore = descrizione?.colore;
  return (
    <Box sx={{ flex: "1 1 280px", minWidth: 0 }}>
      <Box
        sx={{
          borderRadius: 2,
          p: 1.5,
          textAlign: "center",
          border: 1,
          borderColor: colore && colore !== "bianco" ? "transparent" : "divider",
          bgcolor: colore ? `triage.${colore}.main` : "action.hover",
          color: colore ? `triage.${colore}.contrastText` : "text.secondary",
          printColorAdjust: "exact",
          WebkitPrintColorAdjust: "exact",
        }}
      >
        <Typography variant="overline" sx={{ display: "block", lineHeight: 1.6 }}>
          Modello {modello}
        </Typography>
        <Typography sx={{ fontSize: "1.5rem", fontWeight: 800, lineHeight: 1.2 }}>
          {titolo ?? "—"}
        </Typography>
        {descrizione ? (
          <>
            <Typography sx={{ fontWeight: 700 }}>{descrizione.denominazione}</Typography>
            <Typography variant="body2">{descrizione.attesa}</Typography>
          </>
        ) : (
          <Typography variant="body2">Dati insufficienti</Typography>
        )}
      </Box>
      {righe.length > 0 && (
        <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, mt: 1 }}>
          {righe.map((r, i) => (
            <Box
              component="li"
              key={i}
              sx={{ display: "flex", gap: 1, alignItems: "flex-start", py: 0.25 }}
            >
              <Badge livello={r.livello} colore={r.colore} />
              <Typography variant="body2">
                <Box component="span" sx={{ fontWeight: 600 }}>
                  {r.voce}:
                </Box>{" "}
                {r.dettaglio}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

export default function TriageRisultato({ risultato }: { risultato: RisultatoTriage }) {
  const { lazio, veneto } = risultato;
  const descrLazio = lazio ? CODICI_LAZIO[lazio.codice] : null;
  const descrVeneto = veneto ? CODICI_VENETO[veneto.codice] : null;

  return (
    <Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        <Riquadro
          modello="Lazio"
          titolo={lazio && descrLazio ? `${lazio.codice} – ${descrLazio.nome}` : null}
          descrizione={descrLazio}
          righe={(lazio?.righe ?? []).map((r) => ({
            livello: String(r.livello),
            colore: CODICI_LAZIO[r.livello].colore,
            voce: r.voce,
            dettaglio: r.dettaglio,
          }))}
        />
        <Riquadro
          modello="Veneto"
          titolo={descrVeneto?.nome ?? null}
          descrizione={descrVeneto}
          righe={(veneto?.righe ?? []).map((r) => ({
            livello: r.livello,
            colore: r.livello ? CODICI_VENETO[r.livello].colore : null,
            voce: r.voce,
            dettaglio: r.dettaglio,
          }))}
        />
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        Strumento di supporto: l’attribuzione finale del codice resta responsabilità dell’infermiere
        di triage.
      </Typography>
    </Box>
  );
}
