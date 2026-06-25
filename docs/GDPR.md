# Trattamento dati e GDPR

> Questo documento riassume le **misure tecniche** implementate nell'applicazione e
> la **checklist organizzativa** a carico del titolare. Non costituisce consulenza
> legale: per i dati sanitari (categoria particolare, art. 9 GDPR) far validare il
> tutto a un consulente / DPO.

## Natura dei dati

L'app tratta **dati relativi alla salute** (art. 9 GDPR): anagrafica paziente,
valutazione clinica, sintomi, parametri vitali, terapie, diario, esito. Sono dati
particolari e richiedono misure rafforzate.

## Misure tecniche implementate (art. 32)

| Misura | Dove |
|---|---|
| Autenticazione con credenziali individuali + hash bcrypt | `src/lib/auth.ts` |
| Controllo accessi basato su ruoli (NURSE < SUPERVISOR < ADMIN) | `src/lib/roles.ts`, `guard()` |
| Sessione JWT a vita breve (8h) | `src/lib/auth.config.ts` |
| Auto-logout per inattività (30 min) — postazioni condivise | `src/components/IdleLogout.tsx` |
| Rate limit anti brute-force sul login | `src/lib/auth.ts` |
| Forzatura cambio password al primo accesso / dopo reset | `forcePasswordChange` |
| Registro immutabile delle attività (audit log) | `src/lib/audit.ts`, `/admin/audit` |
| Tracciamento export/stampa dei documenti | route PDF e pagina stampa |
| Soft-delete + cestino con ripristino | `deletedAt` |
| Retention automatica (purge cestino + audit) | `src/lib/maintenance.ts`, cron |
| Security headers (HSTS, CSP, X-Frame-Options, ecc.) | `next.config.ts` |
| Minimizzazione: `select` espliciti, niente FK/hash esposti | route API |
| Cifratura in transito (HTTPS) e a riposo | fornita da Vercel/Neon |

## Conservazione dei dati (art. 5(1)(e))

Configurabile via env (`RETENTION_TRASH_DAYS`, `RETENTION_AUDIT_DAYS`):

- **Schede nel cestino**: eliminate definitivamente dopo **90 giorni** (default).
- **Registro di audit**: conservato **730 giorni** (default).

Il job gira ogni notte (`vercel.json` → `/api/maintenance/purge`). **Adeguare i
valori ai termini di legge** sulla documentazione sanitaria applicabili.

## Diritti dell'interessato (artt. 15-22)

- **Accesso / portabilità**: export PDF della singola scheda.
- **Rettifica**: modifica della scheda finché in bozza.
- **Cancellazione**: soft-delete → purge definitivo (ADMIN dal cestino).
- Esiti delle richieste tracciati nel registro di audit.

## Checklist organizzativa a carico del titolare (associazione)

- [ ] Compilare l'**informativa** in `/privacy` con i dati reali (titolare, contatti, DPO se presente).
- [ ] Documentare la **base giuridica** (tipicamente art. 9(2)(c)/(h)).
- [ ] Redigere il **registro dei trattamenti** (art. 30), versione semplificata.
- [ ] Accettare i **DPA** (art. 28) di Neon e Vercel come responsabili esterni.
- [ ] Verificare la **region EU** delle funzioni Vercel (Neon è già a Francoforte).
- [ ] Attivare/verificare i **backup** (Neon Point-in-Time Recovery) e annotare RPO/RTO.
- [ ] Definire una **procedura data breach** (notifica entro 72h).
- [ ] Valutare la necessità di una **DPIA** (art. 35).
- [ ] Nominare e formare gli **incaricati** (autorizzati al trattamento).
