import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import Section from "@/components/scheda/Section";
import { CATEGORIE_SINTOMI, PARAMETRI_COLONNE } from "@/lib/sintomi";
import type { SchedaContent } from "@/lib/scheda";

function TestoLibero({ value }: { value: string }) {
  const text = value.trim();
  if (!text) return <Typography color="text.secondary">—</Typography>;
  return <Typography sx={{ whiteSpace: "pre-wrap" }}>{text}</Typography>;
}

function SintomiView({ sintomi }: { sintomi: SchedaContent["sintomi"] }) {
  const righe = CATEGORIE_SINTOMI.map((cat) => {
    const sel = sintomi[cat.id];
    if (!sel) return null;
    const labels = cat.voci.filter((v) => sel.codici.includes(v.codice)).map((v) => v.label);
    const note = sel.note.trim();
    if (labels.length === 0 && !note) return null;
    return { cat, labels, note };
  }).filter((r): r is NonNullable<typeof r> => r !== null);

  if (righe.length === 0)
    return <Typography color="text.secondary">Nessun sintomo selezionato</Typography>;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {righe.map(({ cat, labels, note }) => (
        <Box key={cat.id}>
          <Typography component="span" sx={{ fontWeight: 700 }}>
            {cat.label}:
          </Typography>{" "}
          <Typography component="span">
            {[labels.join(", "), note].filter(Boolean).join(" — ") || "—"}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export default function SchedaView({ content }: { content: SchedaContent }) {
  const hasParametri = content.parametri.length > 0;
  const hasTerapie = content.terapieSomministrate.length > 0;
  const hasDiario = content.diario.length > 0;

  return (
    <Box>
      <Section title="Sintomi (SAMPLE)">
        <SintomiView sintomi={content.sintomi} />
      </Section>

      <Section title="Monitoraggio parametri">
        {hasParametri ? (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  {PARAMETRI_COLONNE.map((col) => (
                    <TableCell key={col.campo} sx={{ fontWeight: 700 }}>
                      {col.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {content.parametri.map((row, i) => (
                  <TableRow key={i}>
                    {PARAMETRI_COLONNE.map((col) => (
                      <TableCell key={col.campo}>{row[col.campo] || "—"}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography color="text.secondary">Nessuna rilevazione</Typography>
        )}
      </Section>

      <Section title="Anamnesi">
        <TestoLibero value={content.anamnesi} />
      </Section>

      <Section title="Terapia domiciliare">
        {content.negaTerapiaDomiciliare ? (
          <Typography>Nega terapia domiciliare</Typography>
        ) : (
          <TestoLibero value={content.terapiaDomiciliare} />
        )}
      </Section>

      <Section title="Allergie">
        {content.negaAllergie ? (
          <Typography>Nega allergie</Typography>
        ) : (
          <TestoLibero value={content.allergie} />
        )}
      </Section>

      <Section title="Terapia somministrata">
        {hasTerapie ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {content.terapieSomministrate.map((t, i) => (
              <Typography key={i}>
                {[t.ora, t.farmaco, t.dose, t.via].filter(Boolean).join(" · ") || "—"}
                {t.note.trim() ? ` (${t.note.trim()})` : ""}
              </Typography>
            ))}
          </Box>
        ) : (
          <Typography color="text.secondary">Nessuna terapia somministrata</Typography>
        )}
      </Section>

      <Section title="Diario clinico">
        {hasDiario ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {content.diario.map((d, i) => (
              <Typography key={i} sx={{ whiteSpace: "pre-wrap" }}>
                <Typography component="span" sx={{ fontWeight: 700 }}>
                  {d.ora || "—"}
                </Typography>{" "}
                {d.testo}
              </Typography>
            ))}
          </Box>
        ) : (
          <Typography color="text.secondary">Nessuna annotazione</Typography>
        )}
      </Section>

      <Section title="Conclusioni e indicazioni">
        <TestoLibero value={content.conclusioni} />
      </Section>
    </Box>
  );
}
