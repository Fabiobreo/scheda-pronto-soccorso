import type { Metadata } from "next";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { STRUTTURA } from "@/lib/config";
import { RETENTION } from "@/lib/config";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Informativa privacy",
};

// Informativa privacy (artt. 13-14 GDPR). TEMPLATE: i campi tra [parentesi] vanno
// compilati dal titolare con i dati reali, eventualmente con il supporto di un DPO.
// Il testo qui sotto è una base ragionevole, NON una consulenza legale.
function Sezione({ titolo, children }: { titolo: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h3" sx={{ mb: 1 }}>
        {titolo}
      </Typography>
      {children}
    </Box>
  );
}

export default async function PrivacyPage() {
  const session = await auth();
  const loggedIn = Boolean(session?.user);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Link href={loggedIn ? "/" : "/login"}>
        <Button size="small" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
          {loggedIn ? "Torna alle schede" : "Torna al login"}
        </Button>
      </Link>

      <Paper sx={{ p: { xs: 3, sm: 4 } }}>
        <Typography variant="h1" sx={{ mb: 1 }}>
          Informativa sul trattamento dei dati personali
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          ai sensi degli artt. 13-14 del Regolamento (UE) 2016/679 (GDPR)
        </Typography>

        <Alert severity="warning" sx={{ mb: 3 }}>
          Bozza/template: i campi tra [parentesi] devono essere compilati dal titolare del
          trattamento con i dati reali. Far validare il testo a un consulente in materia di
          protezione dei dati prima della pubblicazione.
        </Alert>

        <Sezione titolo="Titolare del trattamento">
          <Typography>
            {STRUTTURA.nome} — [indirizzo], [email di contatto], [PEC]. Eventuale Responsabile della
            Protezione dei Dati (DPO): [nominativo e contatti, se designato].
          </Typography>
        </Sezione>

        <Sezione titolo="Categorie di dati trattati">
          <Typography>
            Dati anagrafici e di contatto (nome, cognome, data di nascita, telefono) e{" "}
            <strong>dati relativi alla salute</strong> (valutazione clinica, sintomi, parametri
            vitali, terapie, diario clinico, esito). I dati sulla salute sono categorie particolari
            ai sensi dell&apos;art. 9 GDPR.
          </Typography>
        </Sezione>

        <Sezione titolo="Finalità e base giuridica">
          <Typography>
            I dati sono trattati per la compilazione e gestione della scheda di soccorso e per
            l&apos;erogazione delle cure. La base giuridica per i dati sulla salute è tipicamente
            l&apos;art. 9(2)(c) (tutela di un interesse vitale dell&apos;interessato) e/o l&apos;art.
            9(2)(h) (finalità di cura), in combinato con l&apos;art. 6(1)(d)/(e). [Confermare la base
            applicabile al proprio contesto.]
          </Typography>
        </Sezione>

        <Sezione titolo="Modalità e misure di sicurezza">
          <Typography>
            Il trattamento è informatizzato, con accesso riservato a personale autorizzato tramite
            credenziali individuali. Sono adottate misure tecniche e organizzative (cifratura in
            transito e a riposo, controllo degli accessi basato su ruoli, registro delle attività,
            timeout di sessione) ai sensi dell&apos;art. 32 GDPR.
          </Typography>
        </Sezione>

        <Sezione titolo="Periodo di conservazione">
          <Typography>
            I dati sono conservati per il tempo necessario alle finalità e nei termini previsti
            dalla normativa sulla documentazione sanitaria. Le schede eliminate vengono rimosse
            definitivamente in automatico dopo {RETENTION.trashDays} giorni; il registro degli
            accessi è conservato per {Math.round(RETENTION.auditDays / 30)} mesi circa. [Adeguare ai
            termini di legge applicabili.]
          </Typography>
        </Sezione>

        <Sezione titolo="Destinatari e trasferimenti">
          <Typography>
            I dati sono ospitati su fornitori di servizi cloud che agiscono come responsabili del
            trattamento (hosting applicativo e database), con server localizzati nell&apos;Unione
            Europea. Non sono previsti trasferimenti verso Paesi terzi. [Indicare i fornitori e i
            relativi accordi ex art. 28.]
          </Typography>
        </Sezione>

        <Sezione titolo="Diritti dell'interessato">
          <Typography>
            L&apos;interessato può esercitare i diritti di accesso, rettifica, cancellazione,
            limitazione, opposizione e portabilità (artt. 15-22 GDPR) scrivendo a [email di
            contatto]. Ha inoltre diritto di proporre reclamo al Garante per la protezione dei dati
            personali.
          </Typography>
        </Sezione>

        <Sezione titolo="Cookie">
          <Typography>
            L&apos;applicazione utilizza esclusivamente cookie tecnici necessari
            all&apos;autenticazione e al funzionamento del servizio. Non sono impiegati cookie di
            profilazione o di terze parti, pertanto non è richiesto alcun consenso.
          </Typography>
        </Sezione>
      </Paper>
    </Container>
  );
}
