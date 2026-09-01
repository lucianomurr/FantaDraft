import type { Player } from "./types";

export interface GkGrid {
  teams: string[];
  weeks: number;
  grid: Record<string, Record<string, number>>;
}

export interface GkPairSuggestion {
  teamA: string;
  teamB: string;
  playerA: Player;
  playerB: Player;
  /** Giornate su `weeks` in cui ENTRAMBE le squadre giocano in trasferta. */
  overlap: number;
  weeks: number;
  combinedFvm: number;
  /** Somma dei gol subiti (proxy solidità difensiva) dei due portieri, se disponibile. */
  combinedGa: number | null;
  /** Coppia di squadre della stessa città (stadio condiviso o calendario che le alterna
   * sempre) — overlap strutturalmente vicino a 0, non un vero "trovato" strategico. */
  derby: boolean;
}

/** Portiere titolare presunto di una squadra: il più citato come titolare nelle fonti
 * probabili formazioni (tit), a parità il FVM più alto. */
function bestKeeperForTeam(players: Player[], team: string): Player | null {
  const gks = players.filter((p) => p.r === "P" && p.s === team);
  if (!gks.length) return null;
  return [...gks].sort((a, b) => b.tit - a.tit || b.f - a.f)[0];
}

export function suggestGkPairs(
  players: Player[],
  gg: GkGrid,
  opts?: { limit?: number; excludeDerby?: boolean },
): GkPairSuggestion[] {
  const keeperByTeam = new Map(gg.teams.map((t) => [t, bestKeeperForTeam(players, t)]));
  const out: GkPairSuggestion[] = [];

  for (let i = 0; i < gg.teams.length; i++) {
    for (let j = i + 1; j < gg.teams.length; j++) {
      const teamA = gg.teams[i];
      const teamB = gg.teams[j];
      const playerA = keeperByTeam.get(teamA);
      const playerB = keeperByTeam.get(teamB);
      if (!playerA || !playerB) continue;
      const overlap = gg.grid[teamA]?.[teamB] ?? gg.grid[teamB]?.[teamA] ?? 0;
      const combinedGa =
        playerA.ga != null && playerB.ga != null ? playerA.ga + playerB.ga : null;
      out.push({
        teamA,
        teamB,
        playerA,
        playerB,
        overlap,
        weeks: gg.weeks,
        combinedFvm: playerA.f + playerB.f,
        combinedGa,
        derby: overlap === 0,
      });
    }
  }

  out.sort(
    (a, b) =>
      a.overlap - b.overlap ||
      a.combinedFvm - b.combinedFvm ||
      (a.combinedGa ?? Infinity) - (b.combinedGa ?? Infinity),
  );
  const filtered = opts?.excludeDerby ? out.filter((p) => !p.derby) : out;
  return opts?.limit ? filtered.slice(0, opts.limit) : filtered;
}

export function pairForTeams(
  players: Player[],
  gg: GkGrid,
  teamA: string,
  teamB: string,
): GkPairSuggestion | null {
  if (teamA === teamB) return null;
  const playerA = bestKeeperForTeam(players, teamA);
  const playerB = bestKeeperForTeam(players, teamB);
  if (!playerA || !playerB) return null;
  const overlap = gg.grid[teamA]?.[teamB] ?? gg.grid[teamB]?.[teamA] ?? 0;
  const combinedGa =
    playerA.ga != null && playerB.ga != null ? playerA.ga + playerB.ga : null;
  return {
    teamA,
    teamB,
    playerA,
    playerB,
    overlap,
    weeks: gg.weeks,
    combinedFvm: playerA.f + playerB.f,
    combinedGa,
    derby: overlap === 0,
  };
}
