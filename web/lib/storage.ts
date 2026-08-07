import type { PersistedState, RoleAllocation, TrackingState } from "./types";

export const STORAGE_KEY = "fanta_asta_2627_v1";

export const DEFAULT_CFG: RoleAllocation = { budget: 500, P: 35, D: 75, C: 105, A: 285 };

export function loadPersisted(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    return {
      cfg: { ...DEFAULT_CFG, ...(o.cfg ?? {}) },
      st: (o.st ?? {}) as TrackingState,
    };
  } catch {
    return null;
  }
}

export function savePersisted(state: PersistedState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage pieno o non disponibile: ignora */
  }
}

export function clearPersisted(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
