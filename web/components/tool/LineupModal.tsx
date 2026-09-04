"use client";

import { useMemo, useState } from "react";
import { useAsta } from "../../contexts/AstaContext";
import { suggestLineups, injuredMine } from "../../lib/lineup";
import type { DerivedPlayer, GiornataMeta, Matchups, Standings } from "../../lib/types";
import { ModalShell } from "./ModalShell";
import { PitchFormation } from "./PitchFormation";

const RMAP: Record<string, string> = { P: "rP", D: "rD", C: "rC", A: "rA" };

function InjuredBox({ players }: { players: DerivedPlayer[] }) {
  if (players.length === 0) return null;
  return (
    <div className="injuredbox">
      <div className="injuredbox-title">🚑 Esclusi perché infortunati ({players.length})</div>
      <ul className="injuredlist">
        {players.map((p) => (
          <li key={p.id}>
            <span className={`rbadge ${RMAP[p.r]}`}>{p.r}</span>
            <b>{p.n}</b>
            <span className="team">{p.s}</span>
            {p.inj && (p.inj.d || p.inj.r) && (
              <div className="injdetail">
                {p.inj.d}
                {p.inj.d && p.inj.r ? " — " : ""}
                {p.inj.r}
              </div>
            )}
          </li>
        ))}
      </ul>
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
  const active = suggestions[tab];

  return (
    <ModalShell open={open} onClose={onClose} title="Formazione consigliata">
      <button className="ghost sm xclose" onClick={onClose} aria-label="Chiudi">
        ✕
      </button>
      <div className="phead">
        <h2>📋 Formazione consigliata</h2>
      </div>

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
          {active && <PitchFormation suggestion={active} matchups={matchups} allPlayers={players} />}
        </>
      )}

      <InjuredBox players={injured} />

      <p className="pmeta" style={{ fontSize: 13, marginTop: 16 }}>
        4 proposte (4-3-3, 4-4-2, 3-5-2, 3-4-3) dalla tua rosa (giocatori segnati &quot;Io&quot;).
        Per ogni ruolo scelgo prima per FVM (il valore che hai pagato/il listone gli dà), poi
        corretto dalla probabilità di titolarità della prossima giornata — un titolare quasi certo
        pesa il triplo di uno in forte dubbio, ma un big non sparisce solo perché in dubbio — e da
        un piccolo correttivo sull&apos;avversario di giornata (attacco forte contro difesa che
        concede molto: premiato; difesa che concede molto contro un attacco forte: penalizzata).
        Campione piccolo a inizio stagione, resta un correttivo minore, non il criterio principale.
      </p>
      <p className="hint" style={{ marginTop: -6 }}>
        Fonte{giornata.fonti && giornata.fonti.length > 1 ? "i" : ""}{" "}
        {giornata.fonti && giornata.fonti.length > 0 ? giornata.fonti.join(" + ") : "SOS Fanta"}
        {giornata.periodo ? `, partite ${giornata.periodo}` : ""}, aggiornato al{" "}
        {new Date(giornata.aggiornato).toLocaleDateString("it-IT", { day: "numeric", month: "long" })}.
        Punto di partenza da controllare tu.
      </p>
    </ModalShell>
  );
}
