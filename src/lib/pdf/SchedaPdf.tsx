import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { CATEGORIE_SINTOMI, PARAMETRI_COLONNE } from "@/lib/sintomi";
import { LABEL_PER_CODICE } from "@/lib/patologie";
import { STRUTTURA } from "@/lib/config";
import type { SchedaContent } from "@/lib/scheda";

// Template PDF deterministico (A4) della scheda. Impaginazione indipendente dal
// browser: intestazione struttura, sezioni, footer con numero pagina.

export interface SchedaPdfMeta {
  titolo: string;
  statoLabel: string;
  completata: string | null; // riga "Completata il … da …", se completata
}

const styles = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 56, paddingHorizontal: 40, fontSize: 9, color: "#1a1a1a" },
  header: {
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#999999",
  },
  strutturaNome: { fontSize: 13, fontWeight: 700 },
  strutturaSub: { fontSize: 9, color: "#555555" },
  titolo: { fontSize: 15, fontWeight: 700, marginTop: 8 },
  meta: { fontSize: 8, color: "#555555", marginTop: 2 },
  section: { marginBottom: 10 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 4,
    backgroundColor: "#f0f0f0",
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  gridItem: { width: "33.33%", marginBottom: 3, paddingRight: 6 },
  label: { fontWeight: 700 },
  muted: { color: "#777777" },
  row: { flexDirection: "row" },
  cell: { borderWidth: 0.5, borderColor: "#bbbbbb", padding: 3, flexGrow: 1, flexBasis: 0 },
  cellHead: { backgroundColor: "#f0f0f0", fontWeight: 700 },
  line: { marginBottom: 2 },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    fontSize: 7,
    color: "#888888",
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#cccccc",
    paddingTop: 4,
  },
});

function Campo({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <View style={styles.gridItem}>
      <Text>
        <Text style={styles.label}>{label}: </Text>
        {value}
      </Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function TestoLibero({ value }: { value: string }) {
  const t = value.trim();
  return t ? <Text>{t}</Text> : <Text style={styles.muted}>—</Text>;
}

export function SchedaPdf({ content, meta }: { content: SchedaContent; meta: SchedaPdfMeta }) {
  const sintomiRighe = CATEGORIE_SINTOMI.map((cat) => {
    const sel = content.sintomi[cat.id];
    if (!sel) return null;
    const labels = cat.voci.filter((v) => sel.codici.includes(v.codice)).map((v) => v.label);
    const note = sel.note.trim();
    if (labels.length === 0 && !note) return null;
    return { cat, text: [labels.join(", "), note].filter(Boolean).join(" — ") };
  }).filter((r): r is NonNullable<typeof r> => r !== null);

  return (
    <Document title={meta.titolo}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.strutturaNome}>{STRUTTURA.nome}</Text>
          <Text style={styles.strutturaSub}>{STRUTTURA.sottotitolo}</Text>
        </View>

        <View>
          <Text style={styles.titolo}>{meta.titolo}</Text>
          <Text style={styles.meta}>
            {meta.statoLabel}
            {meta.completata ? ` · ${meta.completata}` : ""}
          </Text>
        </View>

        <View style={{ marginTop: 10 }}>
          <Section title="Dati paziente">
            <View style={styles.grid}>
              <Campo label="Data" value={content.data} />
              <Campo label="Ora arrivo" value={content.oraArrivo} />
              <Campo label="Ora inizio trattamento" value={content.oraInizioTrattamento} />
              <Campo label="Cognome" value={content.cognome} />
              <Campo label="Nome" value={content.nome} />
              <Campo label="Data di nascita" value={content.dataNascita} />
              <Campo label="Sesso" value={content.sesso} />
              <Campo label="Telefono" value={content.telefono} />
              <Campo label="Gruppo" value={content.gruppo} />
              <Campo label="Codice triage" value={content.codiceTriage} />
              <Campo label="Responsabile" value={content.responsabile} />
            </View>
          </Section>

          <Section title="Valutazione iniziale">
            <View style={styles.grid}>
              <Campo label="Coscienza" value={content.coscienza} />
              <Campo label="Vie aeree" value={content.vieAeree} />
              <Campo label="Respiro" value={content.respiro} />
              <Campo label="Circolo" value={content.circolo} />
              <Campo label="Addome" value={content.addome} />
            </View>
            {content.patologie.length > 0 && (
              <Text style={{ marginTop: 3 }}>
                <Text style={styles.label}>Patologia prevalente: </Text>
                {content.patologie.map((c) => `${c} ${LABEL_PER_CODICE[c] ?? "?"}`).join("; ")}
              </Text>
            )}
          </Section>

          <Section title="Sintomi (SAMPLE)">
            {sintomiRighe.length > 0 ? (
              sintomiRighe.map(({ cat, text }) => (
                <Text key={cat.id} style={styles.line}>
                  <Text style={styles.label}>{cat.label}: </Text>
                  {text || "—"}
                </Text>
              ))
            ) : (
              <Text style={styles.muted}>Nessun sintomo selezionato</Text>
            )}
          </Section>

          <Section title="Monitoraggio parametri">
            {content.parametri.length > 0 ? (
              <View>
                <View style={styles.row}>
                  {PARAMETRI_COLONNE.map((col) => (
                    <Text key={col.campo} style={[styles.cell, styles.cellHead]}>
                      {col.label}
                    </Text>
                  ))}
                </View>
                {content.parametri.map((r, i) => (
                  <View key={i} style={styles.row}>
                    {PARAMETRI_COLONNE.map((col) => (
                      <Text key={col.campo} style={styles.cell}>
                        {r[col.campo] || "—"}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.muted}>Nessuna rilevazione</Text>
            )}
          </Section>

          <Section title="Anamnesi">
            <TestoLibero value={content.anamnesi} />
          </Section>

          <Section title="Terapia domiciliare">
            {content.negaTerapiaDomiciliare ? (
              <Text>Nega terapia domiciliare</Text>
            ) : (
              <TestoLibero value={content.terapiaDomiciliare} />
            )}
          </Section>

          <Section title="Allergie">
            {content.negaAllergie ? (
              <Text>Nega allergie</Text>
            ) : (
              <TestoLibero value={content.allergie} />
            )}
          </Section>

          <Section title="Terapia somministrata">
            {content.terapieSomministrate.length > 0 ? (
              content.terapieSomministrate.map((t, i) => (
                <Text key={i} style={styles.line}>
                  {[t.ora, t.farmaco, t.dose, t.via].filter(Boolean).join(" · ") || "—"}
                  {t.note.trim() ? ` (${t.note.trim()})` : ""}
                </Text>
              ))
            ) : (
              <Text style={styles.muted}>Nessuna terapia somministrata</Text>
            )}
          </Section>

          <Section title="Diario clinico">
            {content.diario.length > 0 ? (
              content.diario.map((d, i) => (
                <Text key={i} style={styles.line}>
                  <Text style={styles.label}>{d.ora || "—"} </Text>
                  {d.testo}
                </Text>
              ))
            ) : (
              <Text style={styles.muted}>Nessuna annotazione</Text>
            )}
          </Section>

          <Section title="Conclusioni e indicazioni">
            <TestoLibero value={content.conclusioni} />
          </Section>

          <Section title="Esito">
            <TestoLibero value={content.esito} />
          </Section>
        </View>

        <View style={styles.footer} fixed>
          <Text>{STRUTTURA.nome}</Text>
          <Text render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} di ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
