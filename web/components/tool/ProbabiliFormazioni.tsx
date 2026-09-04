"use client";

import { useMemo, useState } from "react";
import { useAsta } from "../../contexts/AstaContext";
import { suggestLineups } from "../../lib/lineup";
import type { DerivedPlayer, FormazioniData, Matchups, Role, Standings, TrackingState } from "../../lib/types";
import { PitchFormation } from "./PitchFormation";

const RMAP: Record<Role, string> = { P: "rP", D: "rD", C: "rC", A: "rA" };

export function ProbabiliFormazioni({
  forms,
  players,
  standings,
  matchups,
}: {
  forms: FormazioniData;
  players: DerivedPlayer[];
  standings: Standings;
  matchups: Matchups;
}) {
  const { st } = useAsta();
  const teams = useMemo(
    () => Object.keys(forms.sources[0]?.teams ?? {}).sort(),
    [forms],
  );
  const [team, setTeam] = useState(teams[0] ?? "");
  const [view, setView] = useState<"fonti" | "campo">("fonti");
  const [moduloTab, setModuloTab] = useState(0);

  // "Campo": formazione titolare consigliata per QUALUNQUE squadra reale della
  // Serie A (non solo "mine"), calcolata con gli stessi dati della giornata
  // corrente (startPct + matchups) usati da "Formazione consigliata" — un
  // TrackingState sintetico marca "mine" tutti i giocatori di quella squadra,
  // zero modifiche a lineup.ts, stesso trucco già usato per le rose di lega.
  const suggestions = useMemo(() => {
    if (view !== "campo" || !team) return [];
    const synth: TrackingState = {};
    for (const p of players) {
      if (p.s === team) synth[p.id] = { t: null, tgt: null, s: "mine", p: null, fav: false };
    }
    return suggestLineups(players, synth, standings, matchups);
  }, [view, team, players, standings, matchups]);
  const activeSuggestion = suggestions[moduloTab];

  return (
    <details className="strat">
      <summary>
        🗒 Probabili formazioni 2026/27 ({forms.sources.length} fonti:{" "}
        {forms.sources.map((s) => s.name).join(" · ")})
        <select
          value={team}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            setTeam(e.target.value);
            setModuloTab(0);
          }}
          style={{ marginLeft: 8 }}
        >
          {teams.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </summary>
      <div className="stbody">
        <div className="tabs" style={{ marginBottom: 12 }}>
          <button className={`tab${view === "fonti" ? " on" : ""}`} onClick={() => setView("fonti")}>
            🗒 Fonti (stagionale)
          </button>
          <button className={`tab${view === "campo" ? " on" : ""}`} onClick={() => setView("campo")}>
            ⚽ Campo (prossima giornata)
          </button>
        </div>

        {view === "fonti" ? (
          <>
            <div className="formgrid">
              {forms.sources.map((s) => {
                const d = s.teams[team];
                if (!d) {
                  return (
                    <div className="formcol" key={s.name}>
                      <h4>{s.name}</h4>
                      <div className="fb">—</div>
                    </div>
                  );
                }
                return (
                  <div className="formcol" key={s.name}>
                    <h4>
                      {s.name} <span className="mod">{d.mod}</span>
                    </h4>
                    <ol>
                      {d.xi.map((x, i) => {
                        if (x.id == null) {
                          return (
                            <li className="miss" key={i}>
                              {x.n}
                            </li>
                          );
                        }
                        const ps = st[x.id];
                        const style =
                          ps?.s === "mine"
                            ? { color: "var(--good)", fontWeight: 700 }
                            : ps?.s === "out"
                              ? { opacity: 0.45, textDecoration: "line-through" as const }
                              : undefined;
                        return (
                          <li key={i} style={style}>
                            <span className={`xr ${RMAP[x.r as Role] ?? ""}`}>{x.r}</span>
                            {x.n}
                          </li>
                        );
                      })}
                    </ol>
                    {d.ball.length > 0 && (
                      <div className="fb">⚖ {d.ball.map((b) => b.join(" / ")).join(" · ")}</div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="hint" style={{ marginTop: 8 }}>
              ●=titolare secondo la fonte · sotto ogni XI i ballottaggi segnalati · nomi in
              corsivo = non presenti nel listone quotazioni. Colonna <b>Tit</b> in tabella = in
              quanti XI su {forms.sources.length} il giocatore appare.
            </div>
          </>
        ) : (
          <>
            <p className="hint" style={{ marginBottom: 10 }}>
              Formazione titolare stimata per la prossima giornata (non un preview stagionale
              come le fonti sopra): stessa logica e stessi dati di &quot;Formazione
              consigliata&quot; — FVM corretto da probabilità di titolarità e avversario di
              giornata — applicata a TUTTA la rosa reale di {team || "questa squadra"}, non solo
              alla tua. Include panchina con indicazione casa/fuori.
            </p>
            {suggestions.some((s) => s.starters.length > 0) ? (
              <>
                <div className="tabs" style={{ marginBottom: 12 }}>
                  {suggestions.map((s, i) => (
                    <button
                      key={s.modulo}
                      className={`tab${i === moduloTab ? " on" : ""}`}
                      onClick={() => setModuloTab(i)}
                    >
                      {s.modulo}
                    </button>
                  ))}
                </div>
                {activeSuggestion && (
                  <PitchFormation suggestion={activeSuggestion} matchups={matchups} allPlayers={players} />
                )}
              </>
            ) : (
              <p className="hint">
                Dati insufficienti per {team || "questa squadra"} nella giornata corrente
                (nessuna percentuale di titolarità agganciata per abbastanza giocatori).
              </p>
            )}
          </>
        )}
      </div>
    </details>
  );
}
