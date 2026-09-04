"use client";

import { useMemo, useState } from "react";
import { useAsta } from "../../contexts/AstaContext";
import { suggestLineups, injuredMine } from "../../lib/lineup";
import type { DerivedPlayer, GiornataMeta, Matchups, Standings } from "../../lib/types";
import { ModalShell } from "./ModalShell";
import { PitchFormation } from "./PitchFormation";

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
          {active && <PitchFormation suggestion={active} matchups={matchups} allPlayers={players} />}
        </>
      )}
    </ModalShell>
  );
}
