"use client";

import { useMemo, useState } from "react";
import { useAsta } from "../../contexts/AstaContext";
import { suggestLineups, injuredMine, jokerInfo, type LineupSuggestion } from "../../lib/lineup";
import { matchupLabel } from "../../lib/matchup";
import type { DerivedPlayer, GiornataMeta, Matchups, Standings } from "../../lib/types";
import { ModalShell } from "./ModalShell";
import { PitchFormation } from "./PitchFormation";

const RMAP: Record<string, string> = { P: "rP", D: "rD", C: "rC", A: "rA" };

function pctColor(pct: number | null | undefined): string {
  const v = pct ?? 50;
  if (v >= 80) return "var(--acc2)";
  if (v >= 50) return "var(--f2)";
  return "var(--fx)";
}

function jokerImpact(p: DerivedPlayer): string {
  if (p.r === "P") return `Val ${p.val ?? "—"}`;
  const xg = p.xg != null ? p.xg.toFixed(1) : "—";
  const xa = p.xa != null ? p.xa.toFixed(1) : "—";
  return `xG ${xg} · xA ${xa}`;
}

function StarterRow({
  p,
  starters,
  allPlayers,
  matchups,
}: {
  p: DerivedPlayer;
  starters: DerivedPlayer[];
  allPlayers: DerivedPlayer[];
  matchups: Matchups;
}) {
  const joker = jokerInfo(p, starters, allPlayers);
  const atRisk = joker && !joker.rivalIsStarter;
  const matchup = matchupLabel(p.s, matchups);
  return (
    <li className="lineuprow">
      <span className={`rbadge ${RMAP[p.r]}`}>{p.r}</span>
      <div className="lineuprow-body">
        <div className="lineuprow-name">{p.n}</div>
        <div className="lineuprow-meta">
          {p.s}
          {matchup ? ` · ${matchup}` : ""} · {p.f}cr ·{" "}
          <b style={{ color: pctColor(p.startPct) }}>{p.startPct != null ? `${p.startPct}%` : "—"}</b>
        </div>
      </div>
      {atRisk && (
        <div className="fb" style={{ color: "var(--warn)" }}>
          ⚠ In ballottaggio con {joker.rival.n} ({joker.rival.startPct ?? "—"}%) — occhio se non è tra i tuoi
          titolari, potrebbe scavalcarlo.
        </div>
      )}
    </li>
  );
}

function BenchRow({ p, starters, allPlayers }: { p: DerivedPlayer; starters: DerivedPlayer[]; allPlayers: DerivedPlayer[] }) {
  const joker = jokerInfo(p, starters, allPlayers);
  const isJoker = joker && joker.rivalIsStarter;
  return (
    <li className="lineuprow" style={{ opacity: 0.85 }}>
      <span className={`rbadge ${RMAP[p.r]}`}>{p.r}</span>
      <div className="lineuprow-body">
        <div className="lineuprow-name">{p.n}</div>
        <div className="lineuprow-meta">
          {p.s} · <b style={{ color: pctColor(p.startPct) }}>{p.startPct != null ? `${p.startPct}%` : "—"}</b>
        </div>
      </div>
      {isJoker && (
        <div className="fb" style={{ color: "var(--acc2)" }}>
          ⚔ Ballottaggio con il titolare {joker.rival.n} — se subentra: {jokerImpact(p)}.
        </div>
      )}
    </li>
  );
}

function LineupCard({
  s,
  allPlayers,
  matchups,
}: {
  s: LineupSuggestion;
  allPlayers: DerivedPlayer[];
  matchups: Matchups;
}) {
  if (s.starters.length === 0) {
    return <div className="hint">Rosa insufficiente per questo modulo.</div>;
  }
  return (
    <div className="formcol lineupcol" style={{ fontSize: 13 }}>
      <ul className="livealtlist">
        {s.starters.map((p) => (
          <StarterRow key={p.id} p={p} starters={s.starters} allPlayers={allPlayers} matchups={matchups} />
        ))}
      </ul>
      {s.bench.length > 0 && (
        <>
          <div className="livelabel" style={{ marginTop: 10 }}>
            Panchina
          </div>
          <ul className="livealtlist">
            {s.bench.map((p) => (
              <BenchRow key={p.id} p={p} starters={s.starters} allPlayers={allPlayers} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function LineupModal({
  open,
  onClose,
  players,
  giornata,
  standings,
  matchups,
}: {
  open: boolean;
  onClose: () => void;
  players: DerivedPlayer[];
  giornata: GiornataMeta;
  standings: Standings;
  matchups: Matchups;
}) {
  const { st } = useAsta();
  const injured = useMemo(() => injuredMine(players, st), [players, st]);
  const suggestions = useMemo(
    () => suggestLineups(players, st, standings, matchups),
    [players, st, standings, matchups],
  );
  const anyValid = suggestions.some((s) => s.starters.length > 0);
  const [tab, setTab] = useState(0);
  const [view, setView] = useState<"lista" | "campo">("lista");
  const active = suggestions[tab];

  return (
    <ModalShell open={open} onClose={onClose} title="Formazione consigliata">
      <button className="ghost sm xclose" onClick={onClose} aria-label="Chiudi">
        ✕
      </button>
      <div className="phead">
        <h2>📋 Formazione consigliata</h2>
      </div>
      <p className="pmeta" style={{ fontSize: 13 }}>
        4 proposte (4-3-3, 4-4-2, 3-5-2, 3-4-3) dalla tua rosa (giocatori segnati &quot;Io&quot;).
        Per ogni ruolo scelgo prima per FVM (il valore che hai pagato/il listone gli dà), poi
        corretto dalla probabilità di titolarità della prossima giornata — un titolare quasi certo
        pesa il triplo di uno in forte dubbio, ma un big non sparisce solo perché in dubbio — e da
        un piccolo correttivo sull&apos;avversario di giornata (attacco forte contro difesa che
        concede molto: premiato; difesa che concede molto contro un attacco forte: penalizzata).
        Campione piccolo a inizio stagione, resta un correttivo minore, non il criterio principale.
      </p>
      <p className="hint" style={{ marginTop: -6, marginBottom: 14 }}>
        Fonte{giornata.fonti && giornata.fonti.length > 1 ? "i" : ""}{" "}
        {giornata.fonti && giornata.fonti.length > 0 ? giornata.fonti.join(" + ") : "SOS Fanta"}
        {giornata.periodo ? `, partite ${giornata.periodo}` : ""}, aggiornato al{" "}
        {new Date(giornata.aggiornato).toLocaleDateString("it-IT", { day: "numeric", month: "long" })}.
        Punto di partenza da controllare tu.
      </p>

      {injured.length > 0 && (
        <div className="pmeta" style={{ color: "var(--bad)", marginBottom: 14 }}>
          🚑 Esclusi perché infortunati: {injured.map((p) => p.n).join(", ")}
        </div>
      )}

      {!anyValid ? (
        <p className="hint">
          Rosa ancora incompleta per comporre un modulo valido (serve almeno 1 portiere, 3
          difensori, 3 centrocampisti, 1 attaccante non infortunati).
        </p>
      ) : (
        <>
          <div className="tabs" style={{ marginBottom: 12 }}>
            {suggestions.map((s, i) => (
              <button key={s.modulo} className={`tab${i === tab ? " on" : ""}`} onClick={() => setTab(i)}>
                {s.modulo}
              </button>
            ))}
          </div>
          <div className="tabs viewtoggle" style={{ marginBottom: 12 }}>
            <button className={`tab${view === "lista" ? " on" : ""}`} onClick={() => setView("lista")}>
              🗒 Lista
            </button>
            <button className={`tab${view === "campo" ? " on" : ""}`} onClick={() => setView("campo")}>
              ⚽ Campo
            </button>
          </div>
          {active &&
            (view === "lista" ? (
              <LineupCard s={active} allPlayers={players} matchups={matchups} />
            ) : (
              <PitchFormation suggestion={active} />
            ))}
        </>
      )}
    </ModalShell>
  );
}
