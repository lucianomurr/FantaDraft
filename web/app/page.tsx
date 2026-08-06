"use client";

import { useEffect, useRef, useState } from "react";

const REPARTI = [
  { id: "P", nome: "Portieri", cr: 35, slot: "3 slot", color: "var(--p)" },
  { id: "D", nome: "Difensori", cr: 75, slot: "8 slot", color: "var(--d)" },
  { id: "C", nome: "Centrocampisti", cr: 105, slot: "8 slot", color: "var(--c)" },
  { id: "A", nome: "Attaccanti", cr: 285, slot: "6 slot", color: "var(--a)" },
];

function useCountUp(target: number, run: boolean, ms = 1100) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setV(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, ms]);
  return v;
}

function DashCard({ nome, cr, slot, color, run }: (typeof REPARTI)[number] & { run: boolean }) {
  const n = useCountUp(cr, run);
  return (
    <div className="dcard">
      <div className="rlbl">
        <span className="dot" style={{ background: color }} />
        {nome}
      </div>
      <div className="big">
        {n}
        <small> cr</small>
      </div>
      <div className="line2">{slot}</div>
      <div className="bar">
        <span style={{ transform: run ? `scaleX(${cr / 285})` : "scaleX(0)", background: color }} />
      </div>
    </div>
  );
}

function TotalCard({ run }: { run: boolean }) {
  const n = useCountUp(500, run);
  return (
    <div className="dcard total">
      <div className="rlbl">
        <span className="dot" style={{ background: "linear-gradient(90deg,var(--acc),var(--acc2))" }} />
        Budget totale
      </div>
      <div className="big">
        {n}
        <small> cr</small>
      </div>
      <div className="line2">10 squadre · rosa da 25</div>
      <div className="bar">
        <span
          style={{
            transform: run ? "scaleX(1)" : "scaleX(0)",
            background: "linear-gradient(90deg,var(--acc),var(--acc2))",
          }}
        />
      </div>
    </div>
  );
}

function EmailForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    setMsg("");
    try {
      const r = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        setState("ok");
        setMsg("Fatto. Ti scrivo solo quando esce una versione nuova.");
        setEmail("");
      } else {
        setState("err");
        setMsg(j.error || "Qualcosa è andato storto: riprova tra un attimo.");
      }
    } catch {
      setState("err");
      setMsg("Rete assente o server non raggiungibile: riprova.");
    }
  }

  return (
    <form className="emailform" onSubmit={submit}>
      <input
        type="email"
        required
        placeholder="la-tua@email.it"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="Il tuo indirizzo email"
        disabled={state === "busy"}
      />
      <button type="submit" disabled={state === "busy"}>
        {state === "busy" ? "Invio…" : "Avvisami"}
      </button>
      <p className={`emailmsg ${state === "ok" ? "ok" : state === "err" ? "err" : ""}`} role="status">
        {msg}
      </p>
    </form>
  );
}

export default function Home() {
  const [run, setRun] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setTimeout(() => setRun(true), 250);
    return () => clearTimeout(t);
  }, []);

  return (
    <main>
      <div className="wrap">
        <div className="hero" ref={heroRef}>
          <div className="brandline">
            <span className="ball" aria-hidden>
              ⚽
            </span>
            FantaDraft2027
            <span className="free">100% gratuito</span>
          </div>
          <h1>
            Arriva all&apos;asta coi numeri.
            <br />
            <span className="accent">Esci con la rosa che volevi.</span>
          </h1>
          <p className="sub">
            Tool <b>gratuito e open source</b> per l&apos;asta del fantacalcio Serie A 2026/27:
            un solo file HTML con <b>493 giocatori</b>, statistiche reali di due stagioni,
            probabili formazioni da 5 fonti, rigoristi, infortunati e budget live.
            Niente account, niente installazioni: lo apri e funziona.
          </p>

          <div className="dash" aria-label="Dashboard budget del tool: allocazione di 500 crediti per reparto">
            {REPARTI.map((r) => (
              <DashCard key={r.id} {...r} run={run} />
            ))}
            <TotalCard run={run} />
          </div>

          <div className="ctarow">
            <a className="btn pri" href="/tool/">
              Apri il tool
            </a>
            <a
              className="btn ghost"
              href="https://github.com/lucianomurr/asta-fantacalcio"
              rel="noopener"
            >
              Codice su GitHub
            </a>
          </div>
          <p className="ctanote">
            Funziona nel browser, i dati restano sul tuo computer (localStorage + backup JSON).
          </p>
        </div>
      </div>

      <section aria-labelledby="fonti">
        <div className="wrap">
          <h2 id="fonti">Cosa c&apos;è già dentro</h2>
          <p className="lede">
            Non un altro listone da compilare: i dati sono <b>già incrociati</b> per te,
            giocatore per giocatore, con la fonte dichiarata per ogni numero.
          </p>
          <div className="fonti">
            <div className="fonte">
              <span className="k">Quotazioni ufficiali</span>
              <span className="v">
                Listone 2026/27 con Qt e <b>FVM</b> (la stima reale del prezzo d&apos;asta).
              </span>
              <span className="n">493 giocatori</span>
            </div>
            <div className="fonte">
              <span className="k">Statistiche FBref</span>
              <span className="v">
                Gol, rigori, assist, minuti e titolarità delle ultime <b>due stagioni</b> — Big 5
                europei più Serie B, così anche neopromossi e nuovi arrivi hanno numeri veri.
              </span>
              <span className="n">445 con dati</span>
            </div>
            <div className="fonte">
              <span className="k">xG e xA da Understat</span>
              <span className="v">
                Expected goals e assist per distinguere <b>chi è forte da chi è stato fortunato</b>:
                un 8-gol con 15 di xG è un affare che il prezzo non racconta.
              </span>
              <span className="n">411 coperti</span>
            </div>
            <div className="fonte">
              <span className="k">Probabili formazioni</span>
              <span className="v">
                XI titolari aggregati da <b>SOS Fanta, FantaMaster, Eurosport, Goal e Gazzetta</b>:
                la colonna Tit dice in quante formazioni su 5 il giocatore parte titolare.
              </span>
              <span className="n">5 fonti</span>
            </div>
            <div className="fonte">
              <span className="k">Rigoristi</span>
              <span className="v">
                Gerarchie complete per tutte le squadre (designato + alternative), fonte Gazzetta.
              </span>
              <span className="n">20 squadre</span>
            </div>
            <div className="fonte">
              <span className="k">Infortunati</span>
              <span className="v">
                Prognosi e data di rientro accanto al nome: il crociato di cui non sapevi
                niente non ti costa più 40 crediti.
              </span>
              <span className="n">aggiornati pre-asta</span>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="demo">
        <div className="wrap">
          <h2 id="demo">Una riga vale mille slide</h2>
          <p className="lede">
            Ogni giocatore è una riga così — ordinabile per qualunque colonna. <b>Val</b> è
            l&apos;indice di convenienza, con la formula in chiaro: (3×gol + assist) / FVM × 100,
            cioè bonus attesi per 100 crediti di prezzo.
          </p>
          <div className="rowdemo">
            <table>
              <thead>
                <tr>
                  <th>Giocatore</th>
                  <th>Squadra</th>
                  <th className="num">FVM</th>
                  <th className="num">Gol</th>
                  <th className="num">xG</th>
                  <th className="num">Assist</th>
                  <th className="num">Min</th>
                  <th>Titolarità</th>
                  <th className="num">Val</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="name">Martinez L.</td>
                  <td>Inter</td>
                  <td className="num">370</td>
                  <td className="num">17</td>
                  <td className="num">17.1</td>
                  <td className="num">6</td>
                  <td className="num">2159</td>
                  <td className="tit3">●●●●●</td>
                  <td className="num">15</td>
                </tr>
                <tr>
                  <td className="name">Kean</td>
                  <td>Fiorentina</td>
                  <td className="num">212</td>
                  <td className="num">8</td>
                  <td className="num">15.4</td>
                  <td className="num">1</td>
                  <td className="num">2036</td>
                  <td className="tit3">●●●●●</td>
                  <td className="num">12</td>
                </tr>
                <tr>
                  <td className="why" colSpan={9}>
                    Dati reali dal tool, stagione 2025/26: l&apos;xG di Kean (15.4 contro 8 gol
                    segnati) è il tipo di segnale che all&apos;asta vale più di dieci opinioni.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section aria-labelledby="come">
        <div className="wrap">
          <h2 id="come">Come funziona</h2>
          <div className="steps">
            <div className="step">
              <div>
                <h3>Apri il tool nel browser</h3>
                <p>
                  Un file HTML, zero dipendenze. Tutto quello che segni resta{" "}
                  <b>sul tuo computer</b>: localStorage più backup/ripristino JSON.
                </p>
              </div>
            </div>
            <div className="step">
              <div>
                <h3>Prepara le fasce sui numeri</h3>
                <p>
                  Parti dal <b>preset automatico</b> (FVM pesato per titolarità e rigori) e
                  raffinalo: fasce 1–4, riserve da un credito, la lista X dei nomi da evitare
                  perché costano da titolari ma partono riserve.
                </p>
              </div>
            </div>
            <div className="step">
              <div>
                <h3>All&apos;asta, tracking live</h3>
                <p>
                  Segna chi prendi tu e chi prendono gli altri: budget residuo per reparto,
                  slot riempiti e <b>massima offerta sostenibile</b> ricalcolati a ogni acquisto.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="aggiornamenti">
        <div className="wrap">
          <div className="emailbox">
            <h2 id="aggiornamenti">Ti avviso quando esce una versione nuova</h2>
            <p className="lede" style={{ marginBottom: 0 }}>
              Niente newsletter, niente spam: <b>una mail solo quando il tool cambia davvero</b>{" "}
              (nuove funzioni, dati della stagione nuova).
            </p>
            <EmailForm />
            <p className="emailnote">
              L&apos;email serve solo a questo. Infrastruttura EU (tratto.email), cancellazione
              quando vuoi rispondendo a una mail qualsiasi.
            </p>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap frow">
          <span>
            FantaDraft2027 — gratuito e open source ·{" "}
            <a href="https://github.com/lucianomurr/asta-fantacalcio" rel="noopener">
              GitHub
            </a>
          </span>
          <span>
            Dati: quotazioni ufficiali · FBref · Understat · SOS Fanta · FantaMaster ·
            Eurosport · Goal · Gazzetta · fantacalcio.it
          </span>
        </div>
      </footer>
    </main>
  );
}
