import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Guida al tool — FantaDraft2027",
  description:
    "Come funziona FantaDraft2027 passo per passo, con screenshot reali: budget, fasce, griglia portieri e formazione consigliata dopo l'asta.",
  alternates: { canonical: "/guida" },
};

const STEP: { titolo: string; testo: React.ReactNode; img: string; alt: string }[] = [
  {
    titolo: "Budget e strategia",
    testo: (
      <>
        Al primo avvio scegli i crediti totali e come ripartirli sui 4 reparti: <b>Equilibrio</b>{" "}
        (consigliata), <b>Attacco-centrica</b> o <b>Difensiva</b>. Percentuali tarate su una lega
        da 10 squadre, ma restano modificabili in ogni momento da &quot;Budget &amp;
        allocazione&quot; — anche gli <b>slot di rosa per ruolo</b>, non fissi a 3/8/8/6 se la tua
        lega usa regole diverse.
      </>
    ),
    img: "01-onboarding.png",
    alt: "Schermata di benvenuto con scelta di budget e strategia (Equilibrio, Attacco-centrica, Difensiva)",
  },
  {
    titolo: "Classic o Mantra",
    testo: (
      <>
        Un ruolo per giocatore o sottoruoli multipli con FVM dedicato — cambia il calcolo del
        preset fasce. C&apos;è anche il <b>modificatore difesa</b>, se la tua lega lo usa. Tutto
        modificabile dopo, non solo qui in avvio.
      </>
    ),
    img: "02-classic-mantra.png",
    alt: "Scelta tra formato Classic e Mantra, con checkbox modificatore difesa",
  },
  {
    titolo: "Preset fasce automatico",
    testo: (
      <>
        Precompila le fasce 1–4 (più R e X) su tutto il listone in un click, con parametri
        regolabili: peso della titolarità, aggressività delle soglie R/X, quote per ruolo. La
        formula è in chiaro nel testo — nessuna scatola nera. Resta un punto di partenza, ogni
        fascia è rivedibile a mano dopo.
      </>
    ),
    img: "03-preset-fasce.png",
    alt: "Modale Preset fasce con slider e tabella quote F1-F4 per ruolo",
  },
  {
    titolo: "Le fasce nella tabella",
    testo: (
      <>
        Ogni riga è un giocatore, ordinabile per qualunque colonna: FVM, gol, xG, minuti,{" "}
        <b>Val</b> (indice di convenienza), titolarità aggregata da 6 fonti. Fasce e prezzo target
        si vedono e si toccano riga per riga, senza aprire altro.
      </>
    ),
    img: "04-tabella-fasce.png",
    alt: "Tabella giocatori con fasce colorate e prezzo target compilato",
  },
  {
    titolo: "Budget sotto controllo",
    testo: (
      <>
        Spesa e residuo per reparto in tempo reale, slot riempiti, e la <b>massima offerta
        sostenibile</b> ricalcolata a ogni acquisto — tenendo da parte almeno 1 credito per ogni
        slot ancora vuoto, così non resti mai senza portiere all&apos;ultimo giro.
      </>
    ),
    img: "05-budget.png",
    alt: "Dashboard budget con residuo e slot riempiti per Portieri, Difensori, Centrocampisti, Attaccanti",
  },
  {
    titolo: "Griglia portieri",
    testo: (
      <>
        Calcolata sul calendario ufficiale dell&apos;intera stagione: la coppia di portieri con
        meno giornate in cui <b>entrambe le squadre giocano in trasferta</b> insieme — quasi
        sempre almeno uno gioca in casa, con l&apos;euristica &quot;parte chi gioca in casa&quot;.
        Le stracittadine sono escluse dal Top: sono sempre a 0 per come il calendario alterna le
        loro trasferte, un artefatto di scheduling, non una vera scoperta.
      </>
    ),
    img: "06-griglia-portieri.png",
    alt: "Top coppie di portieri consigliate con giornate scoperte, costo stimato",
  },
  {
    titolo: "Dopo l'asta: la formazione consigliata",
    testo: (
      <>
        A rosa completa si sblocca dall&apos;header: fino a 4 moduli (4-3-3, 4-4-2, 3-5-2, 3-4-3)
        con un tab per scegliere quello che preferisci. Titolari scelti per FVM, corretto dalla
        probabilità di titolarità della giornata corrente (due fonti incrociate) e da un piccolo
        correttivo sull&apos;avversario — attacco forte contro difesa che concede molto premiato,
        difesa che concede molto contro un attacco forte penalizzata. Infortunati esclusi in
        automatico e segnalati.
      </>
    ),
    img: "07-formazione-consigliata.png",
    alt: "Modale Formazione consigliata con tab moduli e titolari con FVM e percentuale di titolarità",
  },
  {
    titolo: "Panchina e ballottaggi",
    testo: (
      <>
        Sotto ogni modulo, la panchina — con i <b>ballottaggi</b> segnalati in entrambe le
        direzioni: un titolare a rischio di essere scavalcato, o un panchinaro che potrebbe
        subentrare a gara in corso con l&apos;xG/xA di cosa potrebbe portare (Val per i portieri).
      </>
    ),
    img: "08-panchina.png",
    alt: "Lista panchina con percentuali di titolarità colorate",
  },
  {
    titolo: "Scheda giocatore",
    testo: (
      <>
        Un click sul nome apre nazionalità, età, storico di tutte le stagioni disponibili (anche
        quella in corso), badge rigorista/infortunio/trasferimento e — se il giocatore è già
        stato preso da un avversario — le <b>alternative più simili</b> ancora libere.
      </>
    ),
    img: "09-scheda-giocatore.png",
    alt: "Scheda giocatore con statistiche, xG/xA e storico stagioni",
  },
];

export default function Guida() {
  return (
    <main>
      <div className="wrap">
        <div className="hero" style={{ paddingBottom: 24 }}>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3.4rem)" }}>Guida al tool</h1>
          <p className="sub">
            Come funziona FantaDraft2027, passo per passo — con schermate vere del tool, non
            mockup. Per iniziare basta <Link href="/tool">aprirlo</Link>, non serve leggere questa
            pagina prima: è qui se vuoi vedere cosa aspettarti prima di arrivare all&apos;asta.
          </p>
        </div>
      </div>

      <section aria-label="Passi" style={{ padding: "10px 0 34px" }}>
        <div className="wrap">
          {STEP.map((s, i) => (
            <div className="guidastep" key={s.titolo}>
              <div className="num">{i + 1}</div>
              <div>
                <h3>{s.titolo}</h3>
                <p>{s.testo}</p>
                <div className="guidaimg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/guida/${s.img}`} alt={s.alt} loading="lazy" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Chiusura" style={{ padding: "10px 0 60px" }}>
        <div className="wrap">
          <p className="lede" style={{ marginBottom: 20 }}>
            Tutti i dati (statistiche, formazioni, infortuni, percentuali di titolarità) vengono
            aggiornati manualmente prima di ogni giornata — la data dell&apos;ultimo aggiornamento
            è sempre visibile in alto nel tool. Fonti complete su{" "}
            <Link href="/fonti">/fonti</Link>.
          </p>
          <p>
            <Link href="/tool" className="btn pri">
              Apri il tool
            </Link>{" "}
            <Link href="/" className="btn ghost" style={{ marginLeft: 10 }}>
              ← Torna alla home
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
