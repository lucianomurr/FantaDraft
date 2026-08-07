import type { Player, TrackingState, Tier } from "./types";

/** Fasce suggerite (campo `pt`, precalcolato da scripts/preset_fasce.py) per i
 * giocatori che non hanno ancora una fascia assegnata a mano. Non tocca mai
 * le scelte manuali esistenti. */
export function computePresetUpdates(
  players: Player[],
  tracking: TrackingState,
): { updates: Record<number, Tier>; count: number } {
  const updates: Record<number, Tier> = {};
  let count = 0;
  for (const p of players) {
    if (!p.pt) continue;
    const existing = tracking[p.id]?.t;
    if (!existing) {
      updates[p.id] = p.pt as Tier;
      count++;
    }
  }
  return { updates, count };
}

export function countEmptyPresetSlots(players: Player[], tracking: TrackingState): number {
  return players.filter((p) => p.pt && !tracking[p.id]?.t).length;
}
