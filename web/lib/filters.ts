import type { DerivedPlayer, TrackingState, FilterState, SortState } from "./types";

export function filterPlayers(
  players: DerivedPlayer[],
  tracking: TrackingState,
  f: FilterState,
  numFormSources: number,
): DerivedPlayer[] {
  const q = f.q.trim().toLowerCase();
  return players.filter((p) => {
    if (f.role !== "ALL" && p.r !== f.role) return false;
    if (f.mrole && !p.rm?.includes(f.mrole)) return false;
    if (f.onlyPen && !p.pen) return false;
    if (f.onlyTit && p.tit < Math.ceil(numFormSources / 2)) return false;
    if (q && !p.n.toLowerCase().includes(q)) return false;
    if (f.team && p.s !== f.team) return false;

    const s = tracking[p.id];
    const tier = s?.t;
    if (f.tier) {
      if (f.tier === "tiered" && !tier) return false;
      else if (f.tier === "none" && tier) return false;
      else if (["1", "2", "3", "4", "R"].includes(f.tier) && String(tier) !== f.tier) return false;
    }

    if (f.hideOut && s?.s === "out") return false;
    if (f.onlyMine && s?.s !== "mine") return false;
    return true;
  });
}

export function sortPlayers(players: DerivedPlayer[], sort: SortState): DerivedPlayer[] {
  const arr = [...players];
  arr.sort((a, b) => {
    if (sort.key === "n" || sort.key === "s") {
      return a[sort.key].localeCompare(b[sort.key]) * sort.dir;
    }
    const va = (a as unknown as Record<string, number | null | undefined>)[sort.key];
    const vb = (b as unknown as Record<string, number | null | undefined>)[sort.key];
    const na = va == null;
    const nb = vb == null;
    if (na && nb) return 0;
    if (na) return 1; // senza dati sempre in fondo
    if (nb) return -1;
    return ((va as number) - (vb as number)) * sort.dir;
  });
  return arr;
}
