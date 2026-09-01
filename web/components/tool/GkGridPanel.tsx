"use client";

import { useMemo, useState } from "react";
import { suggestGkPairs, pairForTeams, type GkGrid, type GkPairSuggestion } from "../../lib/gkgrid";
import type { Player } from "../../lib/types";

function overlapColor(overlap: number, weeks: number): string {
  const ratio = overlap / weeks;
  if (ratio <= 0.15) return "var(--acc2)";
  if (ratio <= 0.25) return "var(--f2)";
  return "var(--fx)";
}

function PairCard({ p, rank }: { p: GkPairSuggestion; rank?: number }) {
  return (
    <div className="formcol" style={{ fontSize: 13 }}>
      <h4>
        {rank != null && <span className="pill">#{rank}</span>}
        <span style={{ marginLeft: rank != null ? 8 : 0 }}>
          {p.teamA} + {p.teamB}
        </span>
        <span
          className="pill"
          style={{ marginLeft: "auto", color: overlapColor(p.overlap, p.weeks), fontWeight: 700 }}
        >
          {p.overlap}/{p.weeks} scoperte
        </span>
      </h4>
      <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
        <div style={{ flex: 1 }}>
          <b>{p.playerA.n}</b> ({p.teamA})
          <div className="fb">
            FVM {p.playerA.f} · Tit {p.playerA.tit}/6{" "}
            {p.playerA.ga != null && <>· GS {p.playerA.ga}</>}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <b>{p.playerB.n}</b> ({p.teamB})
          <div className="fb">
            FVM {p.playerB.f} · Tit {p.playerB.tit}/6{" "}
            {p.playerB.ga != null && <>· GS {p.playerB.ga}</>}
          </div>
        </div>
      </div>
      <div className="fb" style={{ marginTop: 6 }}>
        Costo stimato: {p.playerA.f} + {p.playerB.f} = <b>{p.combinedFvm}</b> FVM
        {p.derby && <> · 🏙 stessa città — quasi mai entrambe fuori casa la stessa giornata</>}
      </div>
    </div>
  );
}

export function GkGridPanel({ players, gkgrid }: { players: Player[]; gkgrid: GkGrid }) {
  const top = useMemo(
    () => suggestGkPairs(players, gkgrid, { limit: 6, excludeDerby: true }),
    [players, gkgrid],
  );
  const [teamA, setTeamA] = useState(gkgrid.teams[0] ?? "");
  const [teamB, setTeamB] = useState(gkgrid.teams[1] ?? "");
  const compared = useMemo(
    () => pairForTeams(players, gkgrid, teamA, teamB),
    [players, gkgrid, teamA, teamB],
  );

  return (
    <details className="strat">
      <summary>🥅 Griglia portieri — miglior coppia per giornate coperte</summary>
      <div className="stbody">
        <p>
          Per ogni coppia di squadre, quante delle {gkgrid.weeks} giornate di campionato le
          vedono ENTRAMBE in trasferta (nessuna indicazione forte su chi far giocare, con
          l&apos;euristica &quot;parte chi gioca in casa&quot;). Meno giornate scoperte = coppia
          più solida per coprire tutta la stagione con due portieri. Il portiere indicato per
          ogni squadra è il presunto titolare (più fonti lo danno titolare, a parità FVM più
          alto) — verifica sempre tu prima dell&apos;asta, è un punto di partenza non un oracolo.
        </p>

        <h3 style={{ margin: "12px 0 6px", fontSize: 12, textTransform: "uppercase", color: "var(--muted)" }}>
          Top coppie consigliate
        </h3>
        <p className="fb" style={{ marginBottom: 8 }}>
          Escluse le stracittadine (Inter-Milan, Lazio-Roma, Juventus-Torino): sono sempre a 0
          giornate scoperte per come il calendario alterna le loro trasferte, ma è un artefatto
          di scheduling, non una vera scoperta strategica — cercale in &quot;Confronta due
          squadre&quot; se ti interessano comunque.
        </p>
        <div className="formgrid">
          {top.map((p, i) => (
            <PairCard key={`${p.teamA}-${p.teamB}`} p={p} rank={i + 1} />
          ))}
        </div>

        <h3 style={{ margin: "16px 0 6px", fontSize: 12, textTransform: "uppercase", color: "var(--muted)" }}>
          Confronta due squadre
        </h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select value={teamA} onChange={(e) => setTeamA(e.target.value)}>
            {gkgrid.teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <span>+</span>
          <select value={teamB} onChange={(e) => setTeamB(e.target.value)}>
            {gkgrid.teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        {compared && (
          <div style={{ marginTop: 10, maxWidth: 420 }}>
            <PairCard p={compared} />
          </div>
        )}
        {!compared && teamA === teamB && (
          <p className="fb" style={{ marginTop: 8 }}>
            Scegli due squadre diverse.
          </p>
        )}
      </div>
    </details>
  );
}
