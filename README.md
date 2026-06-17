# Schede Pronto Soccorso

App web per la compilazione e gestione di schede di pronto soccorso. Una scheda si
compila in **bozza** con autosave; quando è pronta si marca come **completata** e
diventa di sola lettura (visualizza / stampa → PDF).

Stack: Next.js 16 (App Router, Turbopack) · MUI v6 · Prisma v6 + PostgreSQL · Zod ·
TanStack React Query · Vitest. Dettagli e convenzioni in [`CLAUDE.md`](./CLAUDE.md).

## Sviluppo locale

Serve un database PostgreSQL (Neon va benissimo anche in locale).

```bash
npm install
cp .env.example .env        # inserisci DATABASE_URL e DIRECT_URL
npm run db:migrate          # crea le tabelle
npm run dev                 # http://localhost:3000
```

Comandi utili:

```bash
npm run build         # prisma generate && next build
npm run lint
npm run format
npm run test
npm run db:studio     # Prisma Studio
```

## Deploy (GitHub + Neon + Vercel)

1. **Database — [Neon](https://neon.tech)**: crea un progetto. Servono due connection string:
   - `DATABASE_URL` → stringa **pooled** (`...-pooler...`), usata a runtime su Vercel.
   - `DIRECT_URL` → stringa **diretta**, usata da Prisma Migrate.

2. **Vercel — importa il repo GitHub**: aggiungi `DATABASE_URL` e `DIRECT_URL` tra le
   Environment Variables del progetto. La build gira con `npm run build`
   (`prisma generate && next build`).

3. **Migrazione in produzione** (una tantum, dal tuo PC con le env di Neon):

   ```bash
   npx prisma migrate deploy
   ```

> Nota: l'app parte **pubblica** (nessuna autenticazione). `src/lib/apiAuth.ts` è lo
> stub predisposto per innestare Auth.js v5 più avanti senza riscrivere le route.
