// Configurazione di branding/struttura, centralizzata.
//
// Sovrascrivibile da env (NEXT_PUBLIC_* per l'uso anche lato client). Riusata da
// layout/metadata, TopBar e dal PDF, così il nome della struttura sta in un punto solo.

export const APP_NAME = "Schede Pronto Soccorso";

export const STRUTTURA = {
  nome: process.env.NEXT_PUBLIC_STRUTTURA_NOME ?? "Struttura Sanitaria",
  sottotitolo: process.env.NEXT_PUBLIC_STRUTTURA_SOTTOTITOLO ?? "Servizio di Pronto Soccorso",
};
