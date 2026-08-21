import type { DerivedPlayer, TrackingState } from "./types";

/** Punteggio di "produzione" usato per confrontare giocatori dello stesso ruolo:
 * portieri non hanno xG/xA, quindi si usa Val (già basato sui gol subiti);
 * per gli altri ruoli xG+xA è un proxy più stabile del semplice Val (che dipende
 * anche dal FVM, che qui vogliamo confrontare separatamente). */
function productionScore(p: DerivedPlayer): number {
  if (p.r === "P") return p.val ?? 0;
  return (p.xg ?? 0) + (p.xa ?? 0);
}

/** Alternative allo stesso ruolo, ancora libere, ordinate per vicinanza a FVM e
 * produzione attesa del giocatore di riferimento (peso 50/50, entrambe normalizzate
 * sul valore del giocatore stesso per essere comparabili pur avendo scale diverse). */
export function findSimilarPlayers(
  target: DerivedPlayer,
  allPlayers: DerivedPlayer[],
  tracking: TrackingState,
  n = 4,
): DerivedPlayer[] {
  const targetProd = productionScore(target);
  const candidates = allPlayers.filter((p) => {
    if (p.id === target.id || p.r !== target.r) return false;
    const s = tracking[p.id];
    return !s || s.s === "free";
  });
  const scored = candidates.map((p) => {
    const fvmDiff = Math.abs(p.f - target.f) / Math.max(target.f, 1);
    const prodDiff = Math.abs(productionScore(p) - targetProd) / Math.max(Math.abs(targetProd), 1);
    return { p, dist: fvmDiff + prodDiff };
  });
  scored.sort((a, b) => a.dist - b.dist);
  return scored.slice(0, n).map((s) => s.p);
}
