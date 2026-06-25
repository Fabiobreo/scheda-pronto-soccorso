"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import LockResetIcon from "@mui/icons-material/LockReset";

export default function CambiaPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La password deve avere almeno 8 caratteri.");
      return;
    }
    if (password !== confirm) {
      setError("Le due password non coincidono.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/users/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(body.error ?? "Errore durante il cambio password.");
        return;
      }
      setDone(true);
      // Il token JWT contiene ancora forcePasswordChange=true fino al prossimo login.
      // Esegue il logout per forzare una nuova autenticazione con il token aggiornato.
      setTimeout(() => signOut({ callbackUrl: "/login" }), 2000);
    } catch {
      setError("Errore di connessione. Riprova.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
      <Paper sx={{ p: 4, width: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <LockResetIcon color="primary" />
          <Typography variant="h1" sx={{ fontSize: "1.5rem" }}>
            Cambia password
          </Typography>
        </Box>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Un amministratore ha impostato una password temporanea per il tuo account. Scegli una
          nuova password prima di continuare.
        </Typography>

        {done ? (
          <Alert severity="success">
            Password aggiornata. Verrai reindirizzato al login…
          </Alert>
        ) : (
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Nuova password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              autoFocus
            />
            <TextField
              label="Conferma password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
            <Button type="submit" variant="contained" size="large" disabled={pending}>
              {pending ? "Salvataggio…" : "Imposta nuova password"}
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
