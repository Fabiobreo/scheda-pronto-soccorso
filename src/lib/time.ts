// Ora corrente in formato "HH:mm" (campi ora delle sezioni a righe ripetute).
export function nowTime(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

// Data corrente in formato "yyyy-MM-dd" (valore dell'input nativo type="date").
export function nowDate(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// "yyyy-MM-dd" → "dd/MM/yyyy" per la visualizzazione. Valori non conformi
// (righe vecchie, testo libero) sono restituiti invariati.
export function formatDataIt(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : value;
}
