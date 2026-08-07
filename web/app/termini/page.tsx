import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termini e condizioni — FantaDraft2027",
  description:
    "Termini di utilizzo di FantaDraft2027: servizio gratuito senza garanzie, privacy, trattamento email e attribuzione completa delle fonti dei dati.",
  alternates: { canonical: "/termini" },
};

export default function Termini() {
  return (
    <main>
      <div className="wrap">
        <div className="hero" style={{ paddingBottom: 24 }}>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3.4rem)" }}>Termini e condizioni</h1>
          <p className="sub">Ultimo aggiornamento: 6 agosto 2026</p>
        </div>

        <div style={{ maxWidth: "72ch", paddingBottom: 56 }}>
          <h2 style={{ fontSize: "1.4rem" }}>1. Cos&apos;è FantaDraft2027</h2>
          <p className="lede">
            FantaDraft2027 (&quot;il tool&quot;) è un progetto amatoriale, <b>gratuito e open
            source</b> (licenza MIT, codice su{" "}
            <a href="https://github.com/lucianomurr/FantaDraft" rel="noopener">GitHub</a>),
            per la preparazione e la gestione dell&apos;asta del fantacalcio. Non ha scopo di
            lucro, non contiene pubblicità e non richiede registrazione.
          </p>

          <h2 style={{ fontSize: "1.4rem" }}>2. Nessuna garanzia</h2>
          <p className="lede">
            Il tool e i dati sono forniti <b>&quot;così come sono&quot;</b>, senza garanzia di
            correttezza, completezza o aggiornamento. Statistiche, formazioni, gerarchie
            rigoristi e infortuni possono contenere errori o essere superati dagli eventi.
            Le decisioni d&apos;asta restano tue: nessuna responsabilità per aste andate male,
            leghe perse o litigi con gli amici.
          </p>

          <h2 style={{ fontSize: "1.4rem" }}>3. Privacy e dati personali</h2>
          <p className="lede">
            Il tool funziona interamente nel tuo browser: fasce, prezzi e acquisti restano{" "}
            <b>sul tuo dispositivo</b> (localStorage) e non vengono trasmessi a nessuno.
            La landing può usare Google Analytics in forma aggregata. L&apos;indirizzo email,
            se lo lasci, viene usato <b>solo</b> per avvisarti di nuove versioni del tool:
            niente marketing, niente cessione a terzi, infrastruttura EU (tratto.email).
            Puoi chiedere la cancellazione in qualsiasi momento rispondendo a una mail o
            scrivendo a luciano.murruni@gmail.com.
          </p>

          <h2 style={{ fontSize: "1.4rem" }}>4. Fonti dei dati e attribuzioni</h2>
          <p className="lede">
            FantaDraft2027 <b>non è affiliato, sponsorizzato o approvato</b> da nessuna
            delle fonti elencate. I dati sono raccolti da fonti pubblicamente accessibili,
            usati a scopo informativo con attribuzione completa:
          </p>
          <ul className="lede" style={{ lineHeight: 1.9 }}>
            <li>
              <a href="https://fbref.com" rel="noopener nofollow">FBref</a> (Sports Reference
              LLC) — statistiche di gioco 2024/25 e 2025/26 (gol, rigori, assist, minuti,
              presenze), via libreria open source{" "}
              <a href="https://github.com/probberechts/soccerdata" rel="noopener">soccerdata</a>
            </li>
            <li>
              <a href="https://understat.com" rel="noopener nofollow">Understat</a> — xG,
              xA, npxG, tiri, key passes
            </li>
            <li>
              <a href="https://www.fantacalcio.it" rel="noopener nofollow">Fantacalcio.it</a>{" "}
              — listone e quotazioni ufficiali 2026/27 (Qt, FVM), elenco infortunati
            </li>
            <li>
              <a href="https://www.sosfanta.com" rel="noopener nofollow">SOS Fanta</a>,{" "}
              <a href="https://www.fantamaster.it" rel="noopener nofollow">FantaMaster</a>,{" "}
              <a href="https://www.eurosport.it" rel="noopener nofollow">Eurosport Italia</a>,{" "}
              <a href="https://www.goal.com/it" rel="noopener nofollow">Goal Italia</a>,{" "}
              <a href="https://www.gazzetta.it" rel="noopener nofollow">
                La Gazzetta dello Sport
              </a>{" "}
              — probabili formazioni 2026/27; gerarchie rigoristi (Gazzetta, rubrica Fantanews)
            </li>
            <li>
              <a href="https://www.api-football.com" rel="noopener nofollow">API-Football</a>{" "}
              (API-Sports, piano gratuito) — ultimi trasferimenti delle 20 squadre di Serie A
              2026/27
            </li>
            <li>
              <b>Giosuè Fichera</b> (guida pubblicata originariamente sul forum Gruppo
              Esperti) — strategie di ripartizione budget, catalogazione in &quot;Slot&quot;,
              uso di xG/xA per individuare under/overperformer, spiegazione dei modificatori
              d&apos;asta; adattato e non riprodotto testualmente nell&apos;onboarding budget,
              nel promemoria strategia e nei badge 🔥/⚠️ del tool
            </li>
          </ul>
          <p className="lede">
            Le probabili formazioni sono opinioni giornalistiche delle rispettive testate,
            aggregate solo in forma di conteggio: il contenuto editoriale originale non
            viene riprodotto. Dettaglio completo su <Link href="/fonti">/fonti</Link>.
          </p>

          <h2 style={{ fontSize: "1.4rem" }}>5. Rimozione contenuti</h2>
          <p className="lede">
            Se sei il titolare di una fonte e ritieni che l&apos;uso dei dati o
            l&apos;attribuzione non siano corretti,{" "}
            <a href="https://github.com/lucianomurr/FantaDraft/issues" rel="noopener">
              apri una issue su GitHub
            </a>{" "}
            o scrivi a luciano.murruni@gmail.com: i contenuti segnalati verranno rimossi o
            corretti immediatamente.
          </p>

          <h2 style={{ fontSize: "1.4rem" }}>6. Modifiche</h2>
          <p className="lede">
            Questi termini possono cambiare; la versione corrente è sempre quella
            pubblicata su questa pagina, con la data in testa.
          </p>

          <p style={{ marginTop: 28 }}>
            <Link href="/" className="btn ghost">← Torna alla home</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
