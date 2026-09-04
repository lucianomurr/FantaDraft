import type { LeagueImport } from "./types";

export const LEAGUE_STORAGE_KEY = "fanta_league_2627_v1";

export function loadLeague(): LeagueImport | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LEAGUE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LeagueImport;
  } catch {
    return null;
  }
}

export function saveLeague(league: LeagueImport): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LEAGUE_STORAGE_KEY, JSON.stringify(league));
  } catch {
    /* storage pieno o non disponibile: ignora */
  }
}

export function clearLeague(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LEAGUE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
