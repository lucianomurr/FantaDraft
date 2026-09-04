"use client";

import type { DerivedPlayer, Role } from "../../lib/types";
import type { LineupSuggestion } from "../../lib/lineup";

const ROLE_ORDER: Role[] = ["P", "D", "C", "A"];

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function JerseyCard({ p }: { p: DerivedPlayer }) {
  return (
    <div className={`jersey jersey-${p.r}`}>
      <div className="jerseyavatar">{initials(p.n)}</div>
      <div className="jerseyname">{p.n}</div>
      <div className="jerseyteam">{p.s}</div>
      <div className="jerseystats">
        <span>{p.f}cr</span>
        <span>{p.startPct != null ? `${p.startPct}%` : "—"}</span>
      </div>
    </div>
  );
}

/** Formazione disegnata come un campo da calcio: card colorate per ruolo,
 * righe P→D→C→A. Nessuna foto reale (il progetto non ha mai scaricato dati
 * immagine giocatore) — avatar a iniziali al suo posto, dichiarato come
 * deviazione dallo screenshot di riferimento invece di fingere parità. */
export function PitchFormation({ suggestion }: { suggestion: LineupSuggestion }) {
  if (suggestion.starters.length === 0) {
    return <div className="hint">Rosa insufficiente per questo modulo.</div>;
  }
  const byRole: Record<Role, DerivedPlayer[]> = { P: [], D: [], C: [], A: [] };
  for (const p of suggestion.starters) byRole[p.r].push(p);

  return (
    <div className="pitch">
      <div className="pitchbadge">Modulo: {suggestion.modulo}</div>
      {ROLE_ORDER.map((r) => (
        <div className="pitchrow" key={r}>
          {byRole[r].map((p) => (
            <JerseyCard key={p.id} p={p} />
          ))}
        </div>
      ))}
    </div>
  );
}
