# Kickoff nuovo progetto

Sto avviando un nuovo progetto web da zero in questa cartella vuota. Voglio
riusare un set di scelte tecniche collaudate. Procedi così: prima leggi tutto,
poi proponimi un piano (entità del dominio, modelli Prisma, pagine, API) e
aspetta il mio ok PRIMA di scrivere codice.

## Cosa costruiamo

Essenzialmente il mio amico è un infermiere del pronto soccorso. Quando è in giro ha bisogno di fare compilare delle schede ai pazienti e di tenere traccia di queste schede. Le schede sono molto semplici, ma vorrei un'interfaccia pulita per la creazione e la modifica di queste schede. Da quello che ho capito ha bisogno che ci sia un autosave della scheda, finché non viene marcata in qualche modo come completata, da quel momento si può solo condividere, stampare, vedere, ma non modificare.

## Stack (core)

- **Framework:** Next.js (ultima stabile), App Router, Turbopack, directory `src/`, TypeScript strict
- **UI:** Material-UI v6 (MUI) + Emotion CSS-in-JS, tema custom in `src/theme.ts` con `lightTheme` + `darkTheme` e `ThemeContext` (switch chiaro/scuro/system persistito in localStorage, default "system")
- **Font:** Inter via `next/font`
- **Database:** PostgreSQL (Neon in prod) + Prisma ORM v6, singleton in `src/lib/db.ts`
- **Validazione input:** Zod (schemi in `src/lib/schemas/`, un file per entità con `XxxCreateSchema`/`XxxUpdateSchema`)
- **Data fetching client:** TanStack React Query (`useQuery`/`useMutation`), `QueryClientProvider` in `Providers.tsx`. Nei Server Component si va diretti a Prisma, mai `fetch` interno
- **State:** nessuna libreria globale — solo `useState`/`useReducer` + Context (es. `ToastContext`, `ThemeContext`)
- **Date:** `date-fns` v4
- **Deployment:** Vercel
- **Linter/Formatter:** ESLint (eslint-config-next) + Prettier (`semi`, double quotes, 2 spazi, printWidth 100, trailingComma es5, LF)
- **Testing:** Vitest, file `*.test.ts` accanto al sorgente
- **Storybook:** opzionale, file `*.stories.tsx` accanto al componente

NON includere per ora (li aggiungeremo solo se servono): i18n/next-intl, push
notifications, PWA/service worker, Sentry, upload immagini/blob, email.

## Autenticazione

Nessuna auth all'avvio: l'app parte pubblica. MA struttura il codice così da
poter innestare Auth.js v5 (Google OAuth + PrismaAdapter) più avanti senza
riscrivere: tieni separati i layer (API route con helper auth stub in
`src/lib/apiAuth.ts` che per ora ritorna sempre "autorizzato", pagine come
Server Component). Quando aggiungeremo l'auth useremo ruoli gerarchici.

## Convenzioni di codice

- **Componenti:** PascalCase, **default export**, `"use client"` esplicito solo dove serve interattività
- **Utilities/hook:** **named export**; utilities/pages/API in lowercase
- **Costanti:** UPPER_SNAKE_CASE
- **Alias import:** SOLO `@/` → `src/` (niente altri alias)
- **Stile MUI:** sempre `sx` prop + token del tema (`primary.main`, `text.secondary`, `background.paper`). MAI colori hardcoded (`#fff`, `rgb(...)`) — rompono il dark mode. MAI CSS in file `.css`/`.module.css`
- **Server vs Client:** pagine in `app/` sono Server Component di default
- **Link + Button:** usare `<Link href=".."><Button>...</Button></Link>`, mai `<Button component={Link}>` (runtime error in Server Component)
- **TypeScript:** strict, nessun `as any` senza commento che spiega il perché
- **Tipi:** `interface` per oggetti, `type` per union
- **Sicurezza dati:** `select` espliciti in Prisma, mai esporre dati sensibili in client props
- **Rate limit** sulle API pubbliche

## Struttura cartelle target

```
src/
├── app/                # App Router: pagine (Server Component) + api/<entity>/route.ts
├── components/         # Componenti riutilizzabili, organizzati per dominio/feature
├── context/            # ToastContext, ThemeContext, ...
├── hooks/              # Custom hooks (named export)
├── lib/                # db.ts, apiAuth.ts, utilities, schemas/
│   └── schemas/        # Schemi Zod per entità
└── theme.ts            # MUI lightTheme + darkTheme
```

## Pattern per ogni nuova entità (modello + CRUD + UI)

1. Modello in `prisma/schema.prisma`
2. Schema Zod in `src/lib/schemas/<entity>.ts` (`XxxCreateSchema`/`XxxUpdateSchema`)
3. Test schema in `<entity>.test.ts` (Vitest)
4. API: `src/app/api/<entity>/route.ts` (GET list / POST create) + `[id]/route.ts` (GET/PUT/DELETE), con validazione Zod + gestione errori Prisma (P2002 → 409)
5. Componente client `"use client"` che riceve i dati iniziali come props dal Server Component padre
6. Pagina Server Component che fa il fetch iniziale via Prisma e passa al client
7. `npx tsc --noEmit && npm test` prima di considerare fatto

## Comandi attesi (package.json)

```
dev          # next dev (Turbopack)
build        # prisma generate && next build
db:migrate   # prisma migrate dev
db:generate  # prisma generate
db:studio    # prisma studio
lint / format / format:check
test / test:watch
```

## Regole ferree

- Mai `as any` senza commento + motivazione
- Mai colori hardcoded → token tema MUI
- Mai CSS in file `.css`/`.module.css` → solo `sx`/`styled()`
- Mai `<Button component={Link}>` in Server Component
- Mai `fetch` interno nei Server Component → Prisma diretto
- Mai introdurre alias di import oltre `@/`
- Mai librerie di state management globale (Redux/Zustand/...) senza discuterne
- Mai skippare `tsc --noEmit` prima di un push
- `npx tsc --noEmit` SEMPRE verde prima di committare

## Primo passo

1. Inizializza il progetto Next.js (App Router, TS, `src/`, Turbopack) con le
   dipendenze del core stack.
2. Configura MUI con tema chiaro/scuro, Prettier, ESLint, Vitest, Prisma
   (con un datasource PostgreSQL e `DATABASE_URL`/`DIRECT_URL` in `.env.example`).
3. Genera un `CLAUDE.md` iniziale che documenti stack, convenzioni e struttura
   (sul modello di questo prompt).
4. Proponimi il piano del dominio (entità → modelli Prisma → pagine → API)
   basato su "Cosa costruiamo" e aspetta il mio ok prima di implementare.
