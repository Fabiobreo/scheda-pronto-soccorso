// Configurazione di branding/struttura, centralizzata.
//
// Sovrascrivibile da env (NEXT_PUBLIC_* per l'uso anche lato client). Riusata da
// layout/metadata, TopBar e dal PDF, così il nome della struttura sta in un punto solo.

export const APP_NAME = "Schede Pronto Soccorso";

export const STRUTTURA = {
  nome: process.env.NEXT_PUBLIC_STRUTTURA_NOME ?? "Struttura Sanitaria",
  sottotitolo: process.env.NEXT_PUBLIC_STRUTTURA_SOTTOTITOLO ?? "Servizio di Pronto Soccorso",
};

// Politica di conservazione (GDPR art. 5(1)(e) — limitazione della conservazione).
// Sovrascrivibili da env per adattarle alle regole del titolare.
function intEnv(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : fallback;
}

export const RETENTION = {
  // Giorni dopo i quali una scheda nel cestino (soft-deleted) viene eliminata
  // definitivamente in automatico.
  trashDays: intEnv("RETENTION_TRASH_DAYS", 90),
  // Giorni di conservazione del log di audit.
  auditDays: intEnv("RETENTION_AUDIT_DAYS", 730),
};
