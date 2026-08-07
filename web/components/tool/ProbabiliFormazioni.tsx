"use client";

import { useMemo, useState } from "react";
import { useAsta } from "../../contexts/AstaContext";
import type { FormazioniData, Role } from "../../lib/types";

const RMAP: Record<Role, string> = { P: "rP", D: "rD", C: "rC", A: "rA" };

export function ProbabiliFormazioni({ forms }: { forms: FormazioniData }) {
  const { st } = useAsta();
  const teams = useMemo(
    () => Object.keys(forms.sources[0]?.teams ?? {}).sort(),
    [forms],
  );
  const [team, setTeam] = useState(teams[0] ?? "");

  return (
    <details className="strat">
      <summary>
        🗒 Probabili formazioni 2026/27 ({forms.sources.length} fonti:{" "}
        {forms.sources.map((s) => s.name).join(" · ")})
        <select
          value={team}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setTeam(e.target.value)}
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
          ●=titolare secondo la fonte · sotto ogni XI i ballottaggi segnalati · nomi in corsivo
          = non presenti nel listone quotazioni. Colonna <b>Tit</b> in tabella = in quanti XI
          su {forms.sources.length} il giocatore appare.
        </div>
      </div>
    </details>
  );
}
