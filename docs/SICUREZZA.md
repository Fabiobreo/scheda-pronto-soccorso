# Sicurezza — note operative

## Autenticazione e sessioni

- Credenziali email + password (hash **bcrypt**, cost 10), sessione **JWT**.
- Durata sessione **8h** (`maxAge`), rinnovo ogni ora (`updateAge`).
- **Auto-logout** dopo 30 minuti di inattività (postazioni condivise).
- **Rate limit** sul login: 10 tentativi/min per email+IP (best-effort in-memory).
- Reset password amministrato: l'ADMIN imposta una password temporanea →
  `forcePasswordChange` forza il cambio al login successivo.

## Autorizzazione

- Ruoli gerarchici `NURSE < SUPERVISOR < ADMIN` (`src/lib/roles.ts`).
- Pagine protette dal proxy (`src/proxy.ts`); API protette da `guard()`.
- Operazioni ADMIN: gestione utenti, cestino, registro accessi, retention.
- Protezione "ultimo ADMIN attivo": non è possibile rimuovere l'unico amministratore.

## Header HTTP (`next.config.ts`)

HSTS, Content-Security-Policy, X-Frame-Options DENY, X-Content-Type-Options nosniff,
Referrer-Policy, Permissions-Policy.

> **Hardening futuro**: la CSP usa `'unsafe-inline'` per gli script (necessario senza
> nonce). Per una CSP rigida basata su nonce serve integrare la generazione del nonce
> nel proxy e propagarlo a `next/script` e ad Emotion.

## Audit e tracciabilità

- Ogni azione su `Scheda` e `User` è registrata in `AuditLog` (append-only).
- Export/stampa tracciati come `EXPORT`.
- Consultabile da ADMIN in `/admin/audit`.

## Manutenzione automatica

- `/api/maintenance/purge` (cron giornaliero) applica la retention.
- Protetto da `CRON_SECRET` via header `Authorization: Bearer <secret>`.

## Da fare lato infrastruttura

- [ ] Impostare tutte le env di produzione (vedi `.env.example`), incluso `CRON_SECRET`.
- [ ] Ruotare `AUTH_SECRET` in caso di sospetta compromissione (invalida le sessioni).
- [ ] Considerare un rate limit **distribuito** (Upstash/Vercel KV) se il traffico cresce.
- [ ] Valutare **2FA** per gli account ADMIN.
- [ ] Configurare un servizio di **error tracking** (es. Sentry) agganciandolo a `src/lib/logger.ts`.
