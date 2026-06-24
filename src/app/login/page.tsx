"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setPending(false);
    if (res?.error) {
      setError("Email o password non corretti.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <Paper sx={{ p: 4, width: "100%" }}>
      <Typography variant="h1" sx={{ mb: 1, fontSize: "1.5rem" }}>
        Accedi
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Schede Pronto Soccorso
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          autoFocus
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <Button type="submit" variant="contained" size="large" disabled={pending}>
          {pending ? "Accesso in corso…" : "Accedi"}
        </Button>
      </Box>
    </Paper>
  );
}

export default function LoginPage() {
  return (
    <Container maxWidth="xs" sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </Container>
  );
}
