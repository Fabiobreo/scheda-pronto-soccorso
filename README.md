# Schede Pronto Soccorso

App web per la compilazione e gestione di schede di pronto soccorso. Una scheda si
compila in **bozza** con autosave; quando è pronta si marca come **completata** e
diventa di sola lettura (visualizza / stampa → PDF).

Stack: Next.js 16 (App Router, Turbopack) · MUI v6 · Prisma v6 + PostgreSQL ·
Auth.js v5 (Credentials, JWT) · Zod · TanStack React Query · Vitest.
Dettagli e convenzioni in [`CLAUDE.md`](./CLAUDE.md).

## Sviluppo locale

Serve un database PostgreSQL (Neon va benissimo anche in locale).

```bash
npm install
cp .env.example .env        # inserisci almeno DATABASE_URL, DIRECT_URL, AUTH_SECRET
npm run db:migrate          # crea le tabelle
npm run db:seed             # crea il primo utente ADMIN (SEED_ADMIN_*)
npm run dev                 # http://localhost:3000
```

Comandi utili:

```bash
npm run build         # prisma generate && prisma migrate deploy && next build
npm run lint
npm run format
npm run test
npm run db:studio     # Prisma Studio
```

## Deploy (GitHub + Neon + Vercel)

1. **Database — [Neon](https://neon.tech)**: crea un progetto. Servono due connection string:
   - `DATABASE_URL` → stringa **pooled** (`...-pooler...`), usata a runtime su Vercel.
   - `DIRECT_URL` → stringa **diretta**, usata da Prisma Migrate.

2. **Vercel — importa il repo GitHub**: aggiungi tra le Environment Variables, **per
   tutti gli ambienti** (Production + Preview): `DATABASE_URL`, `DIRECT_URL`,
   `AUTH_SECRET`, `CRON_SECRET` e, se vuoi, le `RETENTION_*` / `NEXT_PUBLIC_STRUTTURA_*`
   (vedi [`.env.example`](.env.example)). Dopo aver modificato le env serve un **Redeploy**.
   Imposta la **region delle funzioni su EU** (i dati restano in UE; Neon è a Francoforte).

3. **Migrazioni automatiche al deploy**: la build esegue
   `prisma generate && prisma migrate deploy && next build`, quindi ogni deploy
   applica al database le migration committate. Perché funzioni, le migration in
   `prisma/migrations/` devono essere sul branch che Vercel sta deployando.

4. **Cron di manutenzione**: `vercel.json` registra un job giornaliero su
   `/api/maintenance/purge` che applica la retention. Richiede `CRON_SECRET` impostato.

## Sicurezza e protezione dei dati

L'accesso richiede autenticazione (Auth.js, ruoli `NURSE < SUPERVISOR < ADMIN`).
L'app tratta **dati sanitari** (art. 9 GDPR): misure tecniche e checklist
organizzativa in [`docs/SICUREZZA.md`](docs/SICUREZZA.md) e [`docs/GDPR.md`](docs/GDPR.md).
L'informativa per gli interessati è su `/privacy` (da compilare coi dati reali
dell'associazione).
