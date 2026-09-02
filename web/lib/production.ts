import type { DerivedPlayer } from "./types";

/** Punteggio di produzione attesa — confrontabile SOLO dentro lo stesso ruolo
 * (scale diverse tra ruoli): portieri non hanno xG/xA quindi usano Val (già
 * basato sui gol subiti), gli altri ruoli xG+xA cumulati di stagione. */
export function productionScore(p: DerivedPlayer): number {
  if (p.r === "P") return p.val ?? 0;
  return (p.xg ?? 0) + (p.xa ?? 0);
}
