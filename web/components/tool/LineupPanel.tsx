"use client";

import { useMemo } from "react";
import { useAsta } from "../../contexts/AstaContext";
import { suggestLineups, type LineupSuggestion } from "../../lib/lineup";
import type { DerivedPlayer, GiornataMeta } from "../../lib/types";

const RMAP: Record<string, string> = { P: "rP", D: "rD", C: "rC", A: "rA" };

function pctColor(pct: number | null | undefined): string {
  const v = pct ?? 50;
  if (v >= 80) return "var(--acc2)";
  if (v >= 50) return "var(--f2)";
  return "var(--fx)";
}

function StarterRow({ p }: { p: DerivedPlayer }) {
  return (
    <li>
      <div className="liveresrow" style={{ cursor: "default" }}>
        <span className={`rbadge ${RMAP[p.r]}`}>{p.r}</span>
        <span className="liveresname">{p.n}</span>
        <span className="liveresteam">{p.s}</span>
        <span className="liveresfvm" style={{ color: pctColor(p.startPct), fontWeight: 700 }}>
          {p.startPct != null ? `${p.startPct}%` : "—"}
        </span>
      </div>
    </li>
  );
}

function LineupCard({ s, rank }: { s: LineupSuggestion; rank: number }) {
  return (
    <div className="formcol" style={{ fontSize: 13 }}>
      <h4>
        <span className="pill">#{rank}</span>
        <span style={{ marginLeft: 8 }}>Modulo {s.modulo}</span>
        <span className="pill" style={{ marginLeft: "auto", color: pctColor(s.avgPct), fontWeight: 700 }}>
          {Math.round(s.avgPct)}% media
        </span>
      </h4>
      <ul className="livealtlist" style={{ marginTop: 6 }}>
        {s.starters.map((p) => (
          <StarterRow key={p.id} p={p} />
        ))}
      </ul>
      {s.missingData > 0 && (
        <div className="fb" style={{ marginTop: 6 }}>
          {s.missingData} titolare{s.missingData > 1 ? "i" : ""} senza dato per questa giornata
          (percentuale stimata al 50%, verifica a mano).
        </div>
      )}
    </div>
  );
}

export function LineupPanel({
  players,
  giornata,
}: {
  players: DerivedPlayer[];
  giornata: GiornataMeta;
}) {
  const { st } = useAsta();
  const mineCount = useMemo(() => Object.values(st).filter((s) => s.s === "mine").length, [st]);
  const suggestions = useMemo(() => suggestLineups(players, st, 2), [players, st]);

  return (
    <details className="strat">
      <summary>📋 Formazione consigliata — giornata corrente ({mineCount} giocatori in rosa)</summary>
      <div className="stbody">
        <p>
          Suggerisce fino a 2 formazioni dalla tua rosa (giocatori segnati &quot;Io&quot;), scegliendo
          per ogni ruolo chi ha la probabilità di titolarità più alta per la prossima giornata
          (fonte SOS Fanta{giornata.periodo ? `, partite ${giornata.periodo}` : ""}, aggiornato al{" "}
          {new Date(giornata.aggiornato).toLocaleDateString("it-IT", { day: "numeric", month: "long" })}
          ). Punto di partenza da controllare tu — non conosce infortuni dell&apos;ultima ora né
          scelte tattiche non ancora trapelate.
        </p>
        {mineCount === 0 ? (
          <p className="hint" style={{ marginTop: 8 }}>
            Segna i giocatori presi come &quot;Io&quot; durante l&apos;asta per vedere qui i
            suggerimenti di formazione.
          </p>
        ) : suggestions.length === 0 ? (
          <p className="hint" style={{ marginTop: 8 }}>
            Rosa ancora incompleta per comporre un modulo valido (serve almeno 1 portiere, 3
            difensori, 3 centrocampisti, 1 attaccante).
          </p>
        ) : (
          <div className="formgrid" style={{ marginTop: 10 }}>
            {suggestions.map((s, i) => (
              <LineupCard key={s.modulo} s={s} rank={i + 1} />
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
