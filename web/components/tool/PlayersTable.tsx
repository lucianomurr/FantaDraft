"use client";

import { useAsta } from "../../contexts/AstaContext";
import type { DerivedPlayer, SortKey } from "../../lib/types";
import { PlayerRow } from "./PlayerRow";

interface Col {
  key: SortKey | null;
  label: string;
  num?: boolean;
  title?: string;
  center?: boolean;
}

const MANTRA_COL: Col = { key: null, label: "Ruolo M" };

const COLS: Col[] = [
  { key: "n", label: "Giocatore" },
  { key: "s", label: "Squadra" },
  { key: null, label: "R", center: true },
  { key: "q", label: "Qt ▾", num: true },
  { key: "f", label: "FVM ▾", num: true },
  { key: "gls", label: "G", num: true, title: "Gol stagione (rigori inclusi)" },
  { key: "pk", label: "Rig", num: true },
  { key: "ast", label: "A", num: true, title: "Assist stagione" },
  { key: "xg", label: "xG", num: true, title: "Expected goals (Understat) — tooltip: npxG senza rigori e tiri" },
  { key: "xa", label: "xA", num: true, title: "Expected assist (Understat) — tooltip: key passes" },
  { key: "min", label: "Min", num: true, title: "Minuti giocati — verde ≥1800, giallo 900-1799, grigio <900" },
  { key: "val", label: "Val", num: true, title: "Convenienza: (3×gol + assist) / FVM × 100" },
];

export function PlayersTable({
  players,
  numFormSources,
  onOpenCard,
  mantra,
}: {
  players: DerivedPlayer[];
  numFormSources: number;
  onOpenCard: (id: number) => void;
  mantra: boolean;
}) {
  const { sort, sortBy } = useAsta();
  const cols = mantra ? [...COLS.slice(0, 3), MANTRA_COL, ...COLS.slice(3)] : COLS;

  return (
    <div className="tablewrap">
      <p className="scrollhint">Nome fisso, scorri di lato per le colonne →</p>
      <table>
        <thead>
          <tr>
            {cols.map((c) => (
              <th
                key={c.label}
                className={c.num ? "num" : undefined}
                style={c.center ? { textAlign: "center" } : undefined}
                title={c.title}
                onClick={c.key ? () => sortBy(c.key!) : undefined}
              >
                {c.label}
                {sort.key === c.key ? (sort.dir === 1 ? " ▲" : " ▼") : ""}
              </th>
            ))}
            <th
              style={{ textAlign: "center" }}
              title={`In quanti XI titolari appare (${numFormSources} fonti) · ⚖ = in ballottaggio`}
              onClick={() => sortBy("tit")}
            >
              Tit{sort.key === "tit" ? (sort.dir === 1 ? " ▲" : " ▼") : ""}
            </th>
            <th style={{ textAlign: "center" }}>Fascia</th>
            <th className="num">Tgt</th>
            <th>Asta</th>
          </tr>
        </thead>
        <tbody>
          {players.length === 0 ? (
            <tr>
              <td colSpan={cols.length + 4} style={{ textAlign: "center", color: "var(--muted)", padding: 20 }}>
                Nessun giocatore con questi filtri.
              </td>
            </tr>
          ) : (
            players.map((p) => (
              <PlayerRow
                key={p.id}
                p={p}
                numFormSources={numFormSources}
                onOpenCard={onOpenCard}
                mantra={mantra}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
