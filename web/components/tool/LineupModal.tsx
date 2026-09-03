"use client";

import { useMemo } from "react";
import { useAsta } from "../../contexts/AstaContext";
import { suggestLineups, injuredMine, jokerInfo, type LineupSuggestion } from "../../lib/lineup";
import type { DerivedPlayer, GiornataMeta } from "../../lib/types";
import { ModalShell } from "./ModalShell";

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

function StarterRow({ p, starters, allPlayers }: { p: DerivedPlayer; starters: DerivedPlayer[]; allPlayers: DerivedPlayer[] }) {
  const joker = jokerInfo(p, starters, allPlayers);
  const atRisk = joker && !joker.rivalIsStarter;
  return (
    <li className="lineuprow">
      <span className={`rbadge ${RMAP[p.r]}`}>{p.r}</span>
      <div className="lineuprow-body">
        <div className="lineuprow-name">{p.n}</div>
        <div className="lineuprow-meta">
          {p.s} · {p.f}cr ·{" "}
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
}: {
  s: LineupSuggestion;
  allPlayers: DerivedPlayer[];
}) {
  if (s.starters.length === 0) {
    return (
      <div className="formcol" style={{ fontSize: 13 }}>
        <h4>{s.modulo}</h4>
        <div className="hint">Rosa insufficiente per questo modulo.</div>
      </div>
    );
  }
  return (
    <div className="formcol" style={{ fontSize: 13 }}>
      <h4>{s.modulo}</h4>
      <ul className="livealtlist" style={{ marginTop: 6 }}>
        {s.starters.map((p) => (
          <StarterRow key={p.id} p={p} starters={s.starters} allPlayers={allPlayers} />
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
}: {
  open: boolean;
  onClose: () => void;
  players: DerivedPlayer[];
  giornata: GiornataMeta;
}) {
  const { st } = useAsta();
  const injured = useMemo(() => injuredMine(players, st), [players, st]);
  const suggestions = useMemo(() => suggestLineups(players, st), [players, st]);
  const anyValid = suggestions.some((s) => s.starters.length > 0);

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
        Per ogni ruolo scelgo prima per FVM (il valore che hai pagato/il listone gli dà) poi
        corretto dalla probabilità di titolarità della prossima giornata — un titolare quasi certo
        pesa il triplo di uno in forte dubbio, ma un big non sparisce solo perché in dubbio.
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
        <div className="formgrid lineupgrid">
          {suggestions.map((s) => (
            <LineupCard key={s.modulo} s={s} allPlayers={players} />
          ))}
        </div>
      )}
    </ModalShell>
  );
}
