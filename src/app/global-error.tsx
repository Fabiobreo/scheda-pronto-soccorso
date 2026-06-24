"use client";

// Fallback di ultima istanza: si attiva quando l'errore avviene nel root layout
// stesso (Providers/tema non disponibili). DEVE renderizzare i propri <html>/<body>
// e non può usare i componenti MUI né i token del tema, perché sostituisce il layout
// radice: qui gli stili inline sono l'unica opzione (eccezione consapevole alla
// regola "niente colori hardcoded", che vale per l'app dentro al tema).

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="it">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: 480 }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            Si è verificato un errore critico
          </h1>
          <p style={{ marginBottom: "1.5rem", opacity: 0.7 }}>
            Riprova a caricare la pagina. Se il problema persiste, contatta l’assistenza.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1.25rem",
              fontSize: "1rem",
              cursor: "pointer",
              borderRadius: 6,
            }}
          >
            Riprova
          </button>
        </div>
      </body>
    </html>
  );
}
