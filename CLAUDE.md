@AGENTS.md

# Schede Pronto Soccorso

App web per la compilazione e gestione di **schede di pronto soccorso**. Un infermiere
crea una scheda, la compila (con **autosave** mentre è in bozza) e quando è pronta la
marca come **completata**: da quel momento è in sola lettura e si può solo
visualizzare/stampare (stampa nativa del browser → PDF).

## Stack

- **Next.js 16** (App Router, Turbopack di default, `src/`, TypeScript strict)
- **MUI v6** + Emotion (CSS-in-JS). Integrazione App Router via
  `@mui/material-nextjs/v15-appRouter`. Tema in `src/theme.ts` (`lightTheme` + `darkTheme`).
- **Font:** Inter via `next/font` (variabile CSS `--font-inter`)
- **DB:** PostgreSQL (Neon in prod) + **Prisma v6**, singleton in `src/lib/db.ts`
- **Validazione:** Zod (`src/lib/schemas/`, un file per entità)
- **Data fetching client:** TanStack React Query. Nei Server Component → Prisma diretto, mai `fetch` interno.
- **State:** solo `useState`/`useReducer` + Context (`ThemeContext`, `ToastContext`). Nessuna lib globale.
- **Date:** `date-fns` v4
- **Test:** Vitest (`*.test.ts` accanto al sorgente)
- **Deploy:** Vercel

## Comandi

```
npm run dev          # next dev (Turbopack)
npm run build        # prisma generate && prisma migrate deploy && next build
npm run db:migrate   # prisma migrate dev
npm run db:generate  # prisma generate
npm run db:seed      # crea/aggiorna il primo utente ADMIN (SEED_ADMIN_*)
npm run db:studio    # prisma studio
npm run lint         # eslint (next lint è stato rimosso in Next 16)
npm run format       # prettier --write .
npm run format:check
npm run test         # vitest run
npm run test:watch
```

## Struttura

```
src/
├── app/                # App Router: pagine (Server Component) + api/<entity>/route.ts
├── components/         # Componenti riutilizzabili (Providers.tsx, per dominio/feature)
├── context/            # ThemeContext, ToastContext
├── hooks/              # Custom hooks (named export)
├── lib/                # db.ts, apiAuth.ts, rateLimit.ts, utilities, schemas/
│   └── schemas/        # Schemi Zod per entità
└── theme.ts            # MUI lightTheme + darkTheme
```

## Dominio

Una sola entità: **`Scheda`** (vedi `prisma/schema.prisma`). Tutto il contenuto sta in un
unico documento: i campi scalari come colonne, le sezioni a righe ripetute (parametri,
terapie somministrate, diario) e i sintomi selezionati come colonne **`Json`**. Questa
scelta rende l'**autosave un singolo `PUT`** (nessun upsert di figli).

- Stati: `DRAFT` → `COMPLETED`. Il `PUT` è accettato **solo se `DRAFT`**; su scheda
  `COMPLETED` ritorna `409`. Passare a `COMPLETED` valorizza `completedAt`/`completedById`.
- La tassonomia dei sintomi (categorie + voci) è una costante in `src/lib/sintomi.ts`,
  usata sia per renderizzare le checkbox sia per validare i codici salvati.

## Autenticazione

**Auth.js v5** con **Credentials** (email + password, hash bcrypt) e sessione **JWT**.
Ruoli gerarchici `NURSE < SUPERVISOR < ADMIN` (enum `Role`, confronto in `src/lib/roles.ts`).

- Config edge-safe in `src/lib/auth.config.ts` (usata dal **proxy** `src/proxy.ts`, ex
  "middleware", che protegge le pagine); config completa con il provider in `src/lib/auth.ts`.
- Le **API** non passano dal proxy: si proteggono via `getAuthContext` (`src/lib/apiAuth.ts`,
  legge la sessione reale) attraverso `guard(req, key, limit, { minRole })` → 401/403.
- Primo admin via seed: `npm run db:seed` (`SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`).
  Gestione utenti ADMIN in `/admin/utenti`. Env richiesta: `AUTH_SECRET`.

## Audit e soft-delete

- Ogni azione su `Scheda` è tracciata in `AuditLog` (append-only) via `recordAudit`
  (`src/lib/audit.ts`), nella stessa transazione dell'operazione.
- Le schede non si cancellano: **soft-delete** (`deletedAt` + `deletedById`). Tutte le
  letture filtrano `deletedAt: null`. Cestino ADMIN in `/admin/cestino` (restore/purge).
- Il completamento richiede i campi minimi di `campiMancantiPerCompletamento`
  (`src/lib/scheda.ts`, condivisa client/server → 422). La `PUT` usa concorrenza
  ottimistica via `expectedUpdatedAt` (409 se la scheda è cambiata altrove).

## Pattern per ogni nuova entità

1. Modello in `prisma/schema.prisma`
2. Schema Zod in `src/lib/schemas/<entity>.ts` (`XxxCreateSchema` / `XxxUpdateSchema`)
3. Test schema in `<entity>.test.ts` (Vitest)
4. API: `src/app/api/<entity>/route.ts` (GET list / POST create) + `[id]/route.ts`
   (GET/PUT/DELETE), con Zod, rate limit, `getAuthContext`, errori Prisma (P2002→409, P2025→404)
5. Componente client `"use client"` che riceve i dati iniziali come props dal Server Component
6. Pagina Server Component che fa il fetch iniziale via Prisma e passa al client
7. `npx tsc --noEmit && npm test` prima di considerare fatto

## Regole ferree

- Mai `as any` senza commento + motivazione
- Mai colori hardcoded (`#fff`, `rgb(...)`) → solo token del tema MUI (`primary.main`,
  `text.secondary`, `background.paper`); rompono il dark mode
- Mai CSS in file `.css`/`.module.css` → solo `sx` / `styled()`
- Mai `<Button component={Link}>` in Server Component → usare `<Link href=".."><Button>…</Button></Link>`
- Mai `fetch` interno nei Server Component → Prisma diretto
- Mai alias di import oltre `@/` → `src/`
- Mai librerie di state management globale (Redux/Zustand/…) senza discuterne
- `npx tsc --noEmit` SEMPRE verde prima di committare
- **Next 16:** `params` e `searchParams` sono **async** (Promise) in pagine, layout e route
  handler → vanno sempre `await`-ati. `select` espliciti in Prisma; mai esporre dati sensibili in client props.

## Convenzioni di codice

- **Componenti:** PascalCase, **default export**, `"use client"` solo dove serve interattività
- **Utilities/hook:** **named export**; utilities/pagine/API in lowercase
- **Costanti:** UPPER_SNAKE_CASE
- **Tipi:** `interface` per oggetti, `type` per union
- **Prettier:** `semi`, double quotes, 2 spazi, printWidth 100, trailingComma es5, LF
