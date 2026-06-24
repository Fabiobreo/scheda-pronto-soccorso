"use client";

// Error boundary di route (App Router). Cattura gli errori non gestiti lato client
// e nei Server Component sotto questo segmento, mostrando un fallback con retry.

import { useEffect } from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In produzione il digest correla questo errore al log server-side.
    console.error(error);
  }, [error]);

  return (
    <Container maxWidth="sm" sx={{ py: 10 }}>
      <Box sx={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="h1">Si è verificato un errore</Typography>
        <Typography color="text.secondary">
          Qualcosa è andato storto. Puoi riprovare; se il problema persiste contatta l’assistenza.
        </Typography>
        <Box>
          <Button variant="contained" onClick={reset}>
            Riprova
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
