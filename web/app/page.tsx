"use client";

import { useEffect, useRef, useState } from "react";

const REPARTI = [
  { id: "P", nome: "Portieri", cr: 35, slot: "3 slot", color: "var(--p)" },
  { id: "D", nome: "Difensori", cr: 75, slot: "8 slot", color: "var(--d)" },
  { id: "C", nome: "Centrocampisti", cr: 105, slot: "8 slot", color: "var(--c)" },
  { id: "A", nome: "Attaccanti", cr: 285, slot: "6 slot", color: "var(--a)" },
];

function useCountUp(target: number, run: boolean, ms = 1100, delayMs = 0) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setV(target);
      return;
    }
    let raf = 0;
    let timeout = 0;
    const start = () => {
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / ms);
        setV(Math.round(target * (1 - Math.pow(1 - p, 4))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    timeout = window.setTimeout(start, delayMs);
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [target, run, ms, delayMs]);
  return v;
}

// Le card tallano in sequenza (Porta → Difesa → Centro → Attacco → Totale),
// come una spunta reparto per reparto invece che un pop simultaneo.
const STAGGER_MS = 90;

function DashCard({
  nome,
  cr,
  slot,
  color,
  run,
  index,
}: (typeof REPARTI)[number] & { run: boolean; index: number }) {
  const delay = index * STAGGER_MS;
  const n = useCountUp(cr, run, 1100, delay);
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
        <span
          style={{
            transform: run ? `scaleX(${cr / 285})` : "scaleX(0)",
            background: color,
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>
    </div>
  );
}

function TotalCard({ run, index }: { run: boolean; index: number }) {
  const delay = index * STAGGER_MS;
  const n = useCountUp(500, run, 1100, delay);
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
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>
    </div>
  );
}

function useEmailSubscribe() {
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

  return { email, setEmail, state, msg, submit };
}

function EmailForm() {
  const { email, setEmail, state, msg, submit } = useEmailSubscribe();
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

function HeroEmailForm() {
  const { email, setEmail, state, msg, submit } = useEmailSubscribe();
  return (
    <div className="herosignup">
      <span className="herosignup-label">Non perdere gli aggiornamenti del tool</span>
      <form className="emailform compact" onSubmit={submit}>
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
      </form>
      <p className={`emailmsg ${state === "ok" ? "ok" : state === "err" ? "err" : ""}`} role="status">
        {msg}
      </p>
    </div>
  );
}

/** True una volta sola, quando l'elemento osservato entra nel viewport (niente
 * ri-animazione se l'utente risale e riscende). Fallback sicuro: se JS non
 * parte, `mounted`/`inView` restano false e la classe "js-reveal" non si
 * applica mai, quindi il contenuto resta visibile di default via CSS. */
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, inView };
}

const FONTI: { k: string; v: React.ReactNode; n: string }[] = [
  {
    k: "Quotazioni ufficiali",
    v: (
      <>
        Listone 2026/27 con Qt e <b>FVM</b> (la stima reale del prezzo d&apos;asta).
      </>
    ),
    n: "501 giocatori",
  },
  {
    k: "Statistiche FBref",
    v: (
      <>
        Gol, rigori, assist, minuti e titolarità delle ultime <b>due stagioni</b> — Big 5
        europei più Serie B, così anche neopromossi e nuovi arrivi hanno numeri veri.
      </>
    ),
    n: "453 con dati",
  },
  {
    k: "xG e xA da Understat",
    v: (
      <>
        Expected goals e assist per distinguere <b>chi è forte da chi è stato fortunato</b>: un
        8-gol con 15 di xG è un affare che il prezzo non racconta.
      </>
    ),
    n: "417 coperti",
  },
  {
    k: "Probabili formazioni",
    v: (
      <>
        XI titolari aggregati da <b>SOS Fanta, FantaMaster, Eurosport, Goal, Gazzetta e
        Fantacalcio.it</b>: la colonna Tit dice in quante formazioni su 6 il giocatore parte
        titolare.
      </>
    ),
    n: "6 fonti",
  },
  {
    k: "Rigoristi",
    v: "Gerarchie complete per tutte le squadre (designato + alternative), fonte Gazzetta.",
    n: "20 squadre",
  },
  {
    k: "Infortunati",
    v: "Prognosi e data di rientro accanto al nome: il crociato di cui non sapevi niente non ti costa più 40 crediti.",
    n: "aggiornati pre-asta",
  },
  {
    k: "Ultimi trasferimenti",
    v: "Badge quando il listone ha ancora un giocatore ceduto o in prestito altrove: capita più spesso di quanto pensiate, specie a ridosso dell'asta.",
    n: "121 arrivi tracciati",
  },
];

const FONTI_STAGGER_MS = 70;

function FontiList() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      ref={ref}
      className={`fonti${mounted ? " js-reveal" : ""}${inView ? " in-view" : ""}`}
    >
      {FONTI.map((f, i) => (
        <div className="fonte" key={f.k} style={{ transitionDelay: `${i * FONTI_STAGGER_MS}ms` }}>
          <span className="k">{f.k}</span>
          <span className="v">{f.v}</span>
          <span className="n">{f.n}</span>
        </div>
      ))}
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
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
        <nav className="topnav" aria-label="Principale">
          <div className="brandline">
            <span className="ball" aria-hidden>
              ⚽
            </span>
            FantaDraft2027
            <span className="free">100% gratuito</span>
          </div>
          <a className="navgh" href="https://github.com/lucianomurr/FantaDraft" rel="noopener">
            <GitHubIcon />
            GitHub
          </a>
        </nav>
        <div className="hero" ref={heroRef}>
          <h1>
            Arriva all&apos;asta coi numeri.
            <br />
            <span className="accent">Esci con la rosa che volevi.</span>
          </h1>
          <p className="sub">
            Tool <b>gratuito e open source</b> per l&apos;asta del fantacalcio Serie A 2026/27:{" "}
            <b>501 giocatori</b> con statistiche reali di due stagioni, probabili formazioni
            da 6 fonti, rigoristi, infortunati, ultimi trasferimenti e budget live.
            Niente account, niente installazioni: lo apri e funziona.
          </p>

          <div className="dash" aria-label="Dashboard budget del tool: allocazione di 500 crediti per reparto">
            {REPARTI.map((r, i) => (
              <DashCard key={r.id} {...r} run={run} index={i} />
            ))}
            <TotalCard run={run} index={REPARTI.length} />
          </div>

          <div className="ctarow">
            <a className="btn pri" href="/tool">
              Apri il tool
            </a>
          </div>
          <p className="ctanote">
            Funziona nel browser, i dati restano sul tuo computer (localStorage + backup JSON).
          </p>

          <HeroEmailForm />
        </div>
      </div>

      <section aria-labelledby="fonti">
        <div className="wrap">
          <h2 id="fonti">Cosa c&apos;è già dentro</h2>
          <p className="lede">
            Non un altro listone da compilare: i dati sono <b>già incrociati</b> per te,
            giocatore per giocatore, con la fonte dichiarata per ogni numero.
          </p>
          <FontiList />
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
                  Nessuna installazione. Tutto quello che segni resta{" "}
                  <b>sul tuo computer</b>: localStorage più backup/ripristino JSON.
                </p>
              </div>
            </div>
            <div className="step">
              <div>
                <h3>Prepara le fasce sui numeri</h3>
                <p>
                  Parti dal <b>preset regolabile</b> (peso della titolarità, aggressività
                  delle soglie, quote per ruolo — decidi tu) e raffinalo a mano: fasce 1–4,
                  riserve da un credito, la lista X dei nomi da evitare perché costano da
                  titolari ma partono riserve.
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
            <a href="https://github.com/lucianomurr/FantaDraft" rel="noopener">
              GitHub
            </a>
          </span>
          <span>
            Dati: FBref · Understat · fantacalcio.it · SOS Fanta · FantaMaster · Eurosport ·
            Goal · Gazzetta — <a href="/fonti">tutte le fonti e attribuzioni</a> ·{" "}
            <a href="/termini">termini e condizioni</a>
          </span>
        </div>
      </footer>
    </main>
  );
}
