import type { DerivedPlayer, Role, TrackingState } from "./types";
import { productionScore } from "./production";

/** I 7 moduli classici Fantacalcio (1 portiere sempre, D+C+A=10, D 3-5, C 3-5, A 1-3). */
const MODULI: { d: number; c: number; a: number }[] = [
  { d: 3, c: 4, a: 3 },
  { d: 3, c: 5, a: 2 },
  { d: 4, c: 3, a: 3 },
  { d: 4, c: 4, a: 2 },
  { d: 4, c: 5, a: 1 },
  { d: 5, c: 3, a: 2 },
  { d: 5, c: 4, a: 1 },
];

/** Probabilità usata quando il giocatore non ha `startPct` (non agganciato nel
 * fetch della giornata corrente) — né buona né pessima, così resta comunque
 * selezionabile per riempire un modulo quando in rosa non c'è altro, ma non
 * scavalca mai un titolare con un dato reale sopra il 50%. */
const FALLBACK_PCT = 50;

/** Bonus additivo (non moltiplicativo) da produzione attesa, sommato alla
 * probabilità di titolarità per l'ordinamento — resta un correttivo, non il
 * criterio principale ("anche in base a xG/xA", non "solo"): a parità di
 * probabilità di titolarità decide chi produce di più, ma un +5-10% di
 * probabilità reale pesa comunque più di un bonus da produzione. Scala
 * dichiarata come euristica, da ritarare a occhio: xG+xA cumulato stagione
 * per D/C/A (un attaccante forte è sui 15-25, un difensore sotto i 3) diviso
 * 2 e tetto a +10; Val per i portieri (scala diversa, es. 100+) diviso 10 e
 * stesso tetto +10. */
function productionBonus(p: DerivedPlayer): number {
  return Math.min(10, Math.max(0, productionScore(p) / (p.r === "P" ? 10 : 2)));
}

function lineupScore(p: DerivedPlayer): number {
  return (p.startPct ?? FALLBACK_PCT) + productionBonus(p);
}

export interface LineupSuggestion {
  modulo: string;
  starters: DerivedPlayer[]; // 11, ordinati P poi D poi C poi A
  bench: DerivedPlayer[];
  avgPct: number;
  missingData: number; // quanti titolari non hanno un dato reale (fallback usato)
}

function byRole(players: DerivedPlayer[]): Record<Role, DerivedPlayer[]> {
  const out: Record<Role, DerivedPlayer[]> = { P: [], D: [], C: [], A: [] };
  for (const p of players) out[p.r].push(p);
  for (const r of Object.keys(out) as Role[]) {
    out[r].sort((a, b) => lineupScore(b) - lineupScore(a));
  }
  return out;
}

/** Giocatori posseduti (`status === "mine"`) attualmente infortunati — esclusi
 * a monte dai titolari suggeriti (mai una buona idea schierarli), ma mostrati
 * a parte così l'utente sa perché non compaiono. */
export function injuredMine(allPlayers: DerivedPlayer[], tracking: TrackingState): DerivedPlayer[] {
  return allPlayers.filter((p) => tracking[p.id]?.s === "mine" && p.inj != null);
}

/** Suggerisce fino a 2 formazioni (moduli diversi) per la rosa posseduta e
 * non infortunata, scegliendo per ogni modulo i giocatori con probabilità di
 * titolarità più alta per la giornata corrente in ciascun ruolo, corretta da
 * un bonus di produzione attesa (xG/xA, Val per i portieri). Euristica greedy
 * per modulo (non un solutore combinatorio globale): per rose complete (25
 * giocatori) è comunque ottimale, dato che ordinare per punteggio decrescente
 * dentro ogni ruolo e prendere i primi N è la scelta migliore possibile una
 * volta fissato il modulo. */
export function suggestLineups(
  allPlayers: DerivedPlayer[],
  tracking: TrackingState,
  limit = 2,
): LineupSuggestion[] {
  const mine = allPlayers.filter((p) => tracking[p.id]?.s === "mine" && p.inj == null);
  const grouped = byRole(mine);

  const results: LineupSuggestion[] = [];
  for (const { d, c, a } of MODULI) {
    if (grouped.P.length < 1 || grouped.D.length < d || grouped.C.length < c || grouped.A.length < a) {
      continue;
    }
    const starters = [
      grouped.P[0],
      ...grouped.D.slice(0, d),
      ...grouped.C.slice(0, c),
      ...grouped.A.slice(0, a),
    ];
    const startersId = new Set(starters.map((p) => p.id));
    const bench = mine.filter((p) => !startersId.has(p.id));
    const missingData = starters.filter((p) => p.startPct == null).length;
    const avgPct =
      starters.reduce((sum, p) => sum + (p.startPct ?? FALLBACK_PCT), 0) / starters.length;

    results.push({ modulo: `${d}-${c}-${a}`, starters, bench, avgPct, missingData });
  }

  results.sort((x, y) => y.avgPct - x.avgPct || x.missingData - y.missingData);

  // Evita di proporre 2 formazioni quasi identiche (stessi 11): tiene solo
  // moduli con almeno un titolare diverso dal precedente in classifica.
  const distinct: LineupSuggestion[] = [];
  for (const r of results) {
    const ids = new Set(r.starters.map((p) => p.id));
    const dup = distinct.some((prev) => {
      const prevIds = new Set(prev.starters.map((p) => p.id));
      return ids.size === prevIds.size && [...ids].every((id) => prevIds.has(id));
    });
    if (!dup) distinct.push(r);
    if (distinct.length >= limit) break;
  }
  return distinct;
}
