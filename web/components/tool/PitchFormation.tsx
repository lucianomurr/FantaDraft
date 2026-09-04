"use client";

import type { DerivedPlayer, Matchups, Role } from "../../lib/types";
import { jokerInfo, type LineupSuggestion } from "../../lib/lineup";
import { matchupLabel } from "../../lib/matchup";

const ROLE_ORDER: Role[] = ["P", "D", "C", "A"];

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function JerseyCard({
  p,
  bench,
  matchups,
  starters,
  allPlayers,
}: {
  p: DerivedPlayer;
  bench: boolean;
  matchups?: Matchups;
  starters: DerivedPlayer[];
  allPlayers: DerivedPlayer[];
}) {
  const matchup = matchups ? matchupLabel(p.s, matchups) : null;
  const joker = allPlayers.length > 0 ? jokerInfo(p, starters, allPlayers) : null;
  const atRisk = !bench && joker && !joker.rivalIsStarter;
  const isJoker = bench && joker && joker.rivalIsStarter;
  return (
    <div className={`jersey jersey-${p.r}${bench ? " jersey-bench" : ""}`}>
      {(atRisk || isJoker) && (
        <div
          className="jerseyflag"
          title={
            atRisk
              ? `In ballottaggio con ${joker!.rival.n} — rischio di essere scavalcato`
              : `Ballottaggio col titolare ${joker!.rival.n} — occhio se subentra`
          }
        >
          {atRisk ? "⚠" : "⚔"}
        </div>
      )}
      <div className="jerseyavatar">{initials(p.n)}</div>
      <div className="jerseyname">{p.n}</div>
      <div className="jerseyteam">
        {p.s}
        {matchup ? ` · ${matchup}` : ""}
      </div>
      <div className="jerseystats">
        <span>{p.f}cr</span>
        <span>{p.startPct != null ? `${p.startPct}%` : "—"}</span>
      </div>
    </div>
  );
}

/** Formazione disegnata come un campo da calcio: card colorate per ruolo,
 * righe P→D→C→A, panchina sotto. Nessuna foto reale (il progetto non ha mai
 * scaricato dati immagine giocatore) — avatar a iniziali al suo posto,
 * dichiarato come deviazione dallo screenshot di riferimento invece di
 * fingere parità. `matchups`/`allPlayers` opzionali: se assenti, niente
 * casa/fuori né avvisi di ballottaggio (compatibilità con chiamate che non
 * li hanno ancora — nessuna li omette oggi, ma restano opzionali per non
 * forzare ogni call site). */
export function PitchFormation({
  suggestion,
  matchups,
  allPlayers,
}: {
  suggestion: LineupSuggestion;
  matchups?: Matchups;
  allPlayers?: DerivedPlayer[];
}) {
  if (suggestion.starters.length === 0) {
    return <div className="hint">Rosa insufficiente per questo modulo.</div>;
  }
  const all = allPlayers ?? [];
  const byRole: Record<Role, DerivedPlayer[]> = { P: [], D: [], C: [], A: [] };
  for (const p of suggestion.starters) byRole[p.r].push(p);

  return (
    <div>
      <div className="pitch">
        <div className="pitchbadge">Modulo: {suggestion.modulo}</div>
        {ROLE_ORDER.map((r) => (
          <div className="pitchrow" key={r}>
            {byRole[r].map((p) => (
              <JerseyCard
                key={p.id}
                p={p}
                bench={false}
                matchups={matchups}
                starters={suggestion.starters}
                allPlayers={all}
              />
            ))}
          </div>
        ))}
      </div>
      {suggestion.bench.length > 0 && (
        <div className="pitchbench">
          <div className="livelabel" style={{ marginTop: 12, marginBottom: 6 }}>
            Panchina
          </div>
          <div className="pitchbenchrow">
            {suggestion.bench.map((p) => (
              <JerseyCard
                key={p.id}
                p={p}
                bench={true}
                matchups={matchups}
                starters={suggestion.starters}
                allPlayers={all}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
