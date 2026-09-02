import type { Player, RoleAllocation, TrackingState, Role } from "./types";
import { ROLES } from "./roles";

export interface RoleBudget {
  role: Role;
  alloc: number;
  spent: number;
  mine: number;
  resid: number;
  pct: number;
  over: boolean;
  slotsTarget: number;
}

export interface BudgetSummary {
  roles: RoleBudget[];
  totalSpent: number;
  totalMine: number;
  totalSlots: number;
  emptySlots: number;
  remaining: number;
  maxBid: number;
  overBudget: boolean;
}

export function computeBudgetSummary(
  players: Player[],
  tracking: TrackingState,
  cfg: RoleAllocation,
): BudgetSummary {
  const byRole: Record<Role, { spent: number; mine: number }> = {
    P: { spent: 0, mine: 0 },
    D: { spent: 0, mine: 0 },
    C: { spent: 0, mine: 0 },
    A: { spent: 0, mine: 0 },
  };
  let totalSpent = 0;
  let totalMine = 0;

  for (const p of players) {
    const s = tracking[p.id];
    if (s && s.s === "mine") {
      byRole[p.r].mine++;
      byRole[p.r].spent += s.p ?? 0;
      totalSpent += s.p ?? 0;
      totalMine++;
    }
  }

  const roles: RoleBudget[] = ROLES.map((r) => {
    const alloc = cfg[r] ?? 0;
    const spent = byRole[r].spent;
    const mine = byRole[r].mine;
    const resid = alloc - spent;
    const pct = alloc ? Math.min(100, (spent / alloc) * 100) : 0;
    return { role: r, alloc, spent, mine, resid, pct, over: spent > alloc, slotsTarget: cfg.slots[r] };
  });

  const totalSlots = ROLES.reduce((a, r) => a + cfg.slots[r], 0);
  const emptySlots = totalSlots - totalMine;
  const remaining = cfg.budget - totalSpent;
  const maxBid = remaining - Math.max(0, emptySlots - 1);

  return {
    roles,
    totalSpent,
    totalMine,
    totalSlots,
    emptySlots,
    remaining,
    maxBid,
    overBudget: totalSpent > cfg.budget,
  };
}

export function allocSum(cfg: RoleAllocation): number {
  return ROLES.reduce((a, r) => a + (cfg[r] || 0), 0);
}
