"use client";

import { useMemo, useRef, useState } from "react";
import { useAsta } from "../../contexts/AstaContext";
import { useLeague } from "../../contexts/LeagueContext";
import { parseRosterCsv, rankTeams } from "../../lib/league";
import { suggestLineups } from "../../lib/lineup";
import type { DerivedPlayer, Matchups, Standings, TrackingState } from "../../lib/types";
import { ModalShell } from "./ModalShell";
import { PitchFormation } from "./PitchFormation";

export function LeagueModal({
  open,
  onClose,
  players,
  standings,
  matchups,
}: {
  open: boolean;
  onClose: () => void;
  players: DerivedPlayer[];
  standings: Standings;
  matchups: Matchups;
}) {
  const { toast } = useAsta();
  const { league, importLeague, setMyTeam, clearLeagueData } = useLeague();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"valore" | "formazione">("valore");
  const [selTeam, setSelTeam] = useState<string | null>(null);
  const [moduloTab, setModuloTab] = useState(0);

  const validIds = useMemo(() => new Set(players.map((p) => p.id)), [players]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const parsed = parseRosterCsv(String(rd.result), validIds);
        if (parsed.teams.length === 0) {
          toast("Nessuna squadra trovata nel file — controlla che sia l'export corretto.");
          return;
        }
        importLeague(parsed);
        setSelTeam(null);
        setModuloTab(0);
        toast(
          `Importate ${parsed.teams.length} squadre` +
            (parsed.unmatched.length > 0 ? ` (${parsed.unmatched.length} giocatori non riconosciuti)` : ""),
        );
      } catch {
        toast("File non valido");
      }
    };
    rd.readAsText(f);
    e.target.value = "";
  }

  const ranked = useMemo(() => (league ? rankTeams(league.teams, players) : []), [league, players]);
  const teamsWithMissing = ranked.filter((r) => r.missing > 0);

  const teamForFormation = league
    ? (league.teams.find((t) => t.name === (selTeam ?? league.myTeam)) ?? league.teams[0])
    : undefined;

  const suggestions = useMemo(() => {
    if (!teamForFormation) return [];
    const synth: TrackingState = {};
    for (const { id } of teamForFormation.players) {
      synth[id] = { t: null, tgt: null, s: "mine", p: null, fav: false };
    }
    return suggestLineups(players, synth, standings, matchups);
  }, [teamForFormation, players, standings, matchups]);

  const activeSuggestion = suggestions[moduloTab];

  return (
    <ModalShell open={open} onClose={onClose} title="Analisi lega">
      <button className="ghost sm xclose" onClick={onClose} aria-label="Chiudi">
        ✕
      </button>
      <div className="phead">
        <h2>🏆 Analisi lega</h2>
      </div>

      {!league ? (
        <>
          <p className="pmeta" style={{ fontSize: 13 }}>
            Carica il CSV con le rose di tutta la lega, esportato dall&apos;app leghe.fantacalcio.it
            (una riga per giocatore: squadra, id, crediti pagati). Confronta il valore di ogni rosa e
            fatti suggerire la formazione di qualunque squadra della lega, non solo la tua.
          </p>
          <button className="pri sm" onClick={() => fileRef.current?.click()}>
            ⬆ Carica rose (CSV)
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: "none" }}
            onChange={onFileChange}
          />
        </>
      ) : (
        <>
          <p className="pmeta" style={{ fontSize: 13 }}>
            {league.teams.length} squadre importate,{" "}
            {league.teams.reduce((a, t) => a + t.players.length, 0)} giocatori
            {league.unmatched.length > 0 ? `, ${league.unmatched.length} non riconosciuti` : ""} — aggiornato
            al {new Date(league.importedAt).toLocaleDateString("it-IT", { day: "numeric", month: "long" })}.
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
            <label className="hint" htmlFor="myteam-sel">
              La mia squadra:
            </label>
            <select id="myteam-sel" value={league.myTeam ?? ""} onChange={(e) => setMyTeam(e.target.value || null)}>
              <option value="">— seleziona —</option>
              {league.teams.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
            <button className="ghost sm" onClick={() => fileRef.current?.click()}>
              ⬆ Ricarica CSV
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              style={{ display: "none" }}
              onChange={onFileChange}
            />
            <button
              className="ghost sm"
              onClick={() => {
                if (confirm("Rimuovere i dati della lega importati?")) clearLeagueData();
              }}
            >
              🗑 Rimuovi
            </button>
          </div>

          <div className="tabs" style={{ marginBottom: 12 }}>
            <button className={`tab${tab === "valore" ? " on" : ""}`} onClick={() => setTab("valore")}>
              Valore rose
            </button>
            <button className={`tab${tab === "formazione" ? " on" : ""}`} onClick={() => setTab("formazione")}>
              Formazione
            </button>
          </div>

          {tab === "valore" ? (
            <>
              <div className="tablewrap" style={{ marginBottom: 4 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Squadra</th>
                      <th>Speso</th>
                      <th>FVM rosa</th>
                      <th>Differenza</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map((r) => (
                      <tr key={r.team} style={r.team === league.myTeam ? { background: "var(--panel2)" } : undefined}>
                        <td>
                          {r.team}
                          {r.team === league.myTeam ? " ⭐" : ""}
                        </td>
                        <td>{r.speso}cr</td>
                        <td>{r.fvmTotale}cr</td>
                        <td style={{ color: r.differenza >= 0 ? "var(--good)" : "var(--bad)" }}>
                          {r.differenza >= 0 ? "+" : ""}
                          {r.differenza}cr
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="hint" style={{ marginTop: 8 }}>
                Differenza = FVM totale della rosa meno crediti spesi: positiva vuol dire affare (rosa che
                vale più di quanto pagato), negativa vuol dire speso più del valore stimato.
                {teamsWithMissing.length > 0 &&
                  ` Nota: ${teamsWithMissing.map((r) => `${r.team} (${r.missing})`).join(", ")} hanno giocatori nel CSV non trovati nel listone corrente, esclusi dal FVM.`}
              </p>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 10 }}>
                <select
                  value={teamForFormation?.name ?? ""}
                  onChange={(e) => {
                    setSelTeam(e.target.value);
                    setModuloTab(0);
                  }}
                >
                  {league.teams.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              {suggestions.some((s) => s.starters.length > 0) ? (
                <>
                  <div className="tabs" style={{ marginBottom: 12 }}>
                    {suggestions.map((s, i) => (
                      <button
                        key={s.modulo}
                        className={`tab${i === moduloTab ? " on" : ""}`}
                        onClick={() => setModuloTab(i)}
                      >
                        {s.modulo}
                      </button>
                    ))}
                  </div>
                  {activeSuggestion && (
                    <PitchFormation suggestion={activeSuggestion} matchups={matchups} allPlayers={players} />
                  )}
                </>
              ) : (
                <p className="hint">Rosa insufficiente per comporre un modulo valido per questa squadra.</p>
              )}
            </>
          )}
        </>
      )}
    </ModalShell>
  );
}
