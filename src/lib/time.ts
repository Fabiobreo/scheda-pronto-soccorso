// Ora corrente in formato "HH:mm" (campi ora delle sezioni a righe ripetute).
export function nowTime(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
