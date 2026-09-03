import type { Matchups, Role, Standings } from "./types";

/** Correttivo (moltiplicatore, tipicamente 0.85-1.15) da avversario della
 * giornata: un attacco forte contro una difesa che concede molto va
 * premiato, una difesa che concede molto contro un attacco forte va
 * penalizzata — la stessa logica che usa chi segue il fantacalcio a occhio
 * ("Juventus terza in classifica contro il Lecce ultimo, punto sulla
 * Juventus"). Basato sui gol fatti/subiti della stagione IN CORSO: a inizio
 * anno il campione è piccolo (poche giornate), quindi resta un correttivo
 * minore sopra al punteggio FVM×titolarità, mai il criterio principale. */

const MAX_SWING = 0.15;

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

function leagueAverages(standings: Standings): { gf90: number; ga90: number } {
  let sumGf = 0;
  let sumGa = 0;
  let n = 0;
  for (const s of Object.values(standings)) {
    if (s.mp <= 0) continue;
    sumGf += s.gf / s.mp;
    sumGa += s.ga / s.mp;
    n++;
  }
  return n > 0 ? { gf90: sumGf / n, ga90: sumGa / n } : { gf90: 1, ga90: 1 };
}

function rate(standings: Standings, team: string, key: "gf" | "ga", fallback: number): number {
  const s = standings[team];
  if (!s || s.mp <= 0) return fallback;
  return s[key] / s.mp;
}

export function matchupFactor(
  team: string,
  role: Role,
  standings: Standings,
  matchups: Matchups,
): number {
  const m = matchups[team];
  if (!m) return 1;
  const { gf90: avgGf, ga90: avgGa } = leagueAverages(standings);
  if (avgGf <= 0 || avgGa <= 0) return 1;

  const oppGaRatio = rate(standings, m.opp, "ga", avgGa) / avgGa; // >1 = avversario concede più della media
  const oppGfRatio = rate(standings, m.opp, "gf", avgGf) / avgGf; // >1 = avversario segna più della media

  if (role === "C" || role === "A") {
    return 1 + clamp((oppGaRatio - 1) * MAX_SWING, -MAX_SWING, MAX_SWING);
  }
  // P/D: bonus se l'avversario segna poco, malus se la propria squadra
  // concede tanto (indipendentemente da chi affronta oggi).
  const ownGaRatio = rate(standings, team, "ga", avgGa) / avgGa;
  const oppThreat = clamp((oppGfRatio - 1) * (MAX_SWING / 1.5), -MAX_SWING, MAX_SWING);
  const ownWeakness = clamp((ownGaRatio - 1) * (MAX_SWING / 1.5), -MAX_SWING, MAX_SWING);
  return clamp(1 - oppThreat - ownWeakness, 1 - MAX_SWING, 1 + MAX_SWING);
}

export function matchupLabel(team: string, matchups: Matchups): string | null {
  const m = matchups[team];
  if (!m) return null;
  return m.home ? `vs ${m.opp} (casa)` : `@ ${m.opp} (trasferta)`;
}
