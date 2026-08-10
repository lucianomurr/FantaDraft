import type { StrategyDef, Role, RoleAllocation } from "./types";
import { ROLES } from "./roles";

/**
 * Percentuali per lega da 10 squadre, adattate dalle 3 macro-strategie della
 * guida di Giosuè Fichera (forum Gruppo Esperti) — vedi promemoria nel tool.
 */
export const STRATEGIES: StrategyDef[] = [
  {
    key: "equilibrio",
    label: "Equilibrio",
    P: 9,
    D: 15,
    C: 26,
    A: 50,
    desc: "Nessun all-in estremo: si bilanciano le spese sui 4 reparti. La più vincente nel tempo.",
  },
  {
    key: "attacco",
    label: "Attacco-centrica",
    P: 5,
    D: 10,
    C: 20,
    A: 65,
    desc: "65% in attacco per top scorer pesanti; sacrifici netti su porta e difesa. Enormi soddisfazioni, equilibrio precario.",
  },
  {
    key: "difesa",
    label: "Difensiva",
    P: 12,
    D: 24,
    C: 16,
    A: 48,
    desc: "Ideale col modificatore Difesa: pilastri arretrati + portiere top. Minimizza i malus, costanti +1/+3 a settimana.",
  },
];

export const DEFAULT_STRATEGY = STRATEGIES[0];

/** Distribuisce `budget` sui 4 reparti secondo le percentuali della strategia;
 * l'ultimo ruolo (Attacco) assorbe l'arrotondamento per far tornare la somma esatta.
 * Non tocca mantra/modDifesa (decisi a parte, step successivo dell'onboarding). */
export function distributeBudget(budget: number, strat: StrategyDef): Omit<RoleAllocation, "mantra" | "modDifesa"> {
  const alloc: Partial<Record<Role, number>> = {};
  let sum = 0;
  ROLES.forEach((r, i) => {
    if (i < ROLES.length - 1) {
      const v = Math.round((budget * strat[r]) / 100);
      alloc[r] = v;
      sum += v;
    }
  });
  alloc[ROLES[ROLES.length - 1]] = Math.max(0, budget - sum);
  return { budget, P: alloc.P!, D: alloc.D!, C: alloc.C!, A: alloc.A! };
}
