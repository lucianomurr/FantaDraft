import { matchupFactor } from "./matchup";
import type { DerivedPlayer, Matchups, Role, Standings, TrackingState } from "./types";

/** I 4 moduli richiesti esplicitamente, sempre proposti tutti e 4 (non una
 * selezione automatica dei "migliori") — l'utente decide quale preferisce. */
const MODULI: { label: string; d: number; c: number; a: number }[] = [
  { label: "4-3-3", d: 4, c: 3, a: 3 },
  { label: "4-4-2", d: 4, c: 4, a: 2 },
  { label: "3-5-2", d: 3, c: 5, a: 2 },
  { label: "3-4-3", d: 3, c: 4, a: 3 },
];

/** Probabilità usata quando il giocatore non ha `startPct` (non agganciato nel
 * fetch della giornata corrente) — né buona né pessima. */
const FALLBACK_PCT = 50;

/** Punteggio per scegliere i titolari: FVM come criterio principale (il
 * listone è il punto di partenza — un giocatore di valore resta tale anche
 * con un dato di titolarità incerto), corretto da un fattore 0.3-1.0 sulla
 * probabilità di giocare — mai azzerato del tutto (anche un rotation-risk
 * resta il tuo giocatore migliore se l'alternativa è un fondo rosa), ma un
 * titolare quasi certo pesa comunque il triplo di uno in dubbio. Niente
 * bonus da xG/xA qui: quello serve per valutare l'impatto di chi entra dalla
 * panchina (vedi joker), non per scegliere chi parte titolare. */
function pctFactor(pct: number | null | undefined): number {
  const v = pct ?? FALLBACK_PCT;
  return 0.3 + 0.007 * v;
}

function starterScore(p: DerivedPlayer, standings: Standings, matchups: Matchups): number {
  return p.f * pctFactor(p.startPct) * matchupFactor(p.s, p.r, standings, matchups);
}

export interface JokerInfo {
  rival: DerivedPlayer;
  rivalIsStarter: boolean;
}

export interface LineupSuggestion {
  modulo: string;
  starters: DerivedPlayer[]; // 11, ordinati P poi D poi C poi A
  bench: DerivedPlayer[]; // resto della rosa (non infortunati), stesso ordine
}

function byRole(
  players: DerivedPlayer[],
  standings: Standings,
  matchups: Matchups,
): Record<Role, DerivedPlayer[]> {
  const out: Record<Role, DerivedPlayer[]> = { P: [], D: [], C: [], A: [] };
  for (const p of players) out[p.r].push(p);
  for (const r of Object.keys(out) as Role[]) {
    out[r].sort((a, b) => starterScore(b, standings, matchups) - starterScore(a, standings, matchups));
  }
  return out;
}

/** Giocatori posseduti (`status === "mine"`) attualmente infortunati — mai
 * in campo, mostrati a parte per trasparenza. */
export function injuredMine(allPlayers: DerivedPlayer[], tracking: TrackingState): DerivedPlayer[] {
  return allPlayers.filter((p) => tracking[p.id]?.s === "mine" && p.inj != null);
}

/** Propone le 4 formazioni richieste (4-3-3, 4-4-2, 3-5-2, 3-4-3) dalla rosa
 * posseduta e non infortunata: per ogni ruolo, i migliori per FVM corretto
 * dalla probabilità di titolarità della giornata corrente e da un
 * correttivo minore sull'avversario di giornata (vedi matchup.ts). Greedy
 * per modulo, non un solutore combinatorio — con 25 giocatori fissi è
 * comunque la scelta migliore possibile una volta fissato il modulo
 * (ordina per punteggio e prendi i primi N). */
export function suggestLineups(
  allPlayers: DerivedPlayer[],
  tracking: TrackingState,
  standings: Standings,
  matchups: Matchups,
): LineupSuggestion[] {
  const mine = allPlayers.filter((p) => tracking[p.id]?.s === "mine" && p.inj == null);
  const grouped = byRole(mine, standings, matchups);

  return MODULI.map(({ label, d, c, a }) => {
    if (grouped.P.length < 1 || grouped.D.length < d || grouped.C.length < c || grouped.A.length < a) {
      return { modulo: label, starters: [], bench: [] };
    }
    const starters = [
      grouped.P[0],
      ...grouped.D.slice(0, d),
      ...grouped.C.slice(0, c),
      ...grouped.A.slice(0, a),
    ];
    const startersId = new Set(starters.map((p) => p.id));
    const bench = mine.filter((p) => !startersId.has(p.id));
    return { modulo: label, starters, bench };
  });
}

/** Se `p` è in ballottaggio (ha un rivale in rosa avversaria/propria per la
 * maglia) e il rivale è nella formazione titolare data, segnala il "joker":
 * chi in panchina potrebbe subentrare o strappare il posto, con l'xG/xA
 * (Val per i portieri) come indicatore di cosa potrebbe portare a partita
 * in corso. */
export function jokerInfo(
  p: DerivedPlayer,
  starters: DerivedPlayer[],
  allPlayers: DerivedPlayer[],
): JokerInfo | null {
  if (p.ballotRival == null) return null;
  const rival = allPlayers.find((x) => x.id === p.ballotRival);
  if (!rival) return null;
  return { rival, rivalIsStarter: starters.some((s) => s.id === rival.id) };
}
