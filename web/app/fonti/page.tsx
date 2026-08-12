import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fonti e attribuzioni — FantaDraft2027",
  description:
    "Tutte le fonti dei dati usati da FantaDraft2027: FBref, Understat, quotazioni ufficiali, SOS Fanta, FantaMaster, Eurosport, Goal, Gazzetta dello Sport, Fantacalcio.it.",
  alternates: { canonical: "/fonti" },
};

const FONTI = [
  {
    gruppo: "Dati statistici",
    voci: [
      {
        nome: "FBref (Sports Reference LLC)",
        url: "https://fbref.com",
        cosa: "Statistiche di gioco delle stagioni 2024/25 e 2025/26: gol, rigori, assist, minuti, presenze. Scaricate tramite la libreria open source soccerdata.",
      },
      {
        nome: "Understat",
        url: "https://understat.com",
        cosa: "Expected goals (xG), expected assist (xA), npxG, tiri e key passes.",
      },
    ],
  },
  {
    gruppo: "Quotazioni e infortunati",
    voci: [
      {
        nome: "Fantacalcio.it",
        url: "https://www.fantacalcio.it",
        cosa: "Listone e quotazioni ufficiali 2026/27 (Qt e FVM); elenco infortunati con prognosi e date di rientro.",
      },
    ],
  },
  {
    gruppo: "Probabili formazioni e rigoristi",
    voci: [
      { nome: "SOS Fanta", url: "https://www.sosfanta.com", cosa: "Formazioni tipo 2026/27 e ballottaggi." },
      { nome: "FantaMaster", url: "https://www.fantamaster.it", cosa: "Probabili formazioni, moduli e ballottaggi." },
      { nome: "Eurosport Italia", url: "https://www.eurosport.it", cosa: "Formazioni tipo delle 20 squadre di Serie A." },
      { nome: "Goal Italia", url: "https://www.goal.com/it", cosa: "Formazioni titolari squadra per squadra." },
      {
        nome: "La Gazzetta dello Sport",
        url: "https://www.gazzetta.it",
        cosa: "Formazioni tipo, gerarchie dei rigoristi e consigli per squadra (rubrica Fantanews).",
      },
      {
        nome: "Fantacalcio.it",
        url: "https://www.fantacalcio.it/probabili-formazioni-serie-a",
        cosa: "Probabili formazioni della prossima giornata, moduli e ballottaggi.",
      },
    ],
  },
  {
    gruppo: "Trasferimenti",
    voci: [
      {
        nome: "API-Football (API-Sports)",
        url: "https://www.api-football.com",
        cosa: "Ultimi trasferimenti delle 20 squadre di Serie A 2026/27 — arrivi ed eventuali cessioni non ancora riflesse nel listone. Piano gratuito.",
      },
    ],
  },
  {
    gruppo: "Metodologia d'asta",
    voci: [
      {
        nome: "Giosuè Fichera — guida pubblicata sul forum Gruppo Esperti",
        url: null,
        cosa: "Strategie di ripartizione budget per numero di partecipanti, catalogazione dei giocatori in \"Slot\", uso di xG/xA per individuare under/overperformer, spiegazione dei modificatori d'asta. Adattato (non riprodotto testualmente) nell'onboarding budget, nel promemoria strategia e nei badge 🔥/⚠️ sulla colonna xG del tool.",
      },
    ],
  },
];

export default function Fonti() {
  return (
    <main>
      <div className="wrap">
        <div className="hero" style={{ paddingBottom: 24 }}>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3.4rem)" }}>Fonti e attribuzioni</h1>
          <p className="sub">
            FantaDraft2027 è un progetto amatoriale, <b>gratuito, open source e senza
            pubblicità</b>, non affiliato, sponsorizzato o approvato da nessuna delle
            testate e dei servizi citati. Ogni numero mostrato nel tool dichiara la
            propria fonte; qui c&apos;è l&apos;elenco completo.
          </p>
        </div>
      </div>

      {FONTI.map((g) => (
        <section key={g.gruppo} aria-label={g.gruppo} style={{ padding: "34px 0" }}>
          <div className="wrap">
            <h2 style={{ fontSize: "1.5rem" }}>{g.gruppo}</h2>
            <div className="fonti">
              {g.voci.map((v) => (
                <div className="fonte" key={v.nome}>
                  <span className="k">
                    {v.url ? (
                      <a href={v.url} rel="noopener nofollow" style={{ color: "inherit" }}>
                        {v.nome}
                      </a>
                    ) : (
                      v.nome
                    )}
                  </span>
                  <span className="v">{v.cosa}</span>
                  <span className="n">{v.url ? v.url.replace("https://", "") : "forum"}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section aria-label="Note" style={{ padding: "34px 0" }}>
        <div className="wrap">
          <h2 style={{ fontSize: "1.5rem" }}>Note</h2>
          <p className="lede" style={{ marginBottom: 12 }}>
            Le probabili formazioni sono opinioni giornalistiche delle rispettive testate:
            qui vengono aggregate solo in forma di conteggio (in quanti XI su 5 un
            giocatore appare) e <b>il contenuto editoriale originale non viene riprodotto</b>.
            I dati statistici sono fatti sportivi, attribuiti alla fonte che li ha raccolti.
          </p>
          <p className="lede" style={{ marginBottom: 12 }}>
            Software: <a href="https://github.com/probberechts/soccerdata" rel="noopener">soccerdata</a>{" "}
            per lo scraping, <a href="https://nextjs.org" rel="noopener">Next.js</a> per questa pagina,
            font <a href="https://fonts.google.com/specimen/Barlow+Condensed" rel="noopener">Barlow Condensed</a> (OFL).
          </p>
          <p className="lede">
            Sei il titolare di una fonte e vuoi rimozione o attribuzione diversa?{" "}
            <a href="https://github.com/lucianomurr/FantaDraft/issues" rel="noopener">
              Apri una issue su GitHub
            </a>{" "}
            — rimozione immediata.
          </p>
          <p style={{ marginTop: 28 }}>
            <Link href="/" className="btn ghost">
              ← Torna alla home
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
