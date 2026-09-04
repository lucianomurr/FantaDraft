"use client";

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { LeagueImport } from "../lib/types";
import { clearLeague, loadLeague, saveLeague } from "../lib/leagueStorage";

interface LeagueState {
  league: LeagueImport | null;
  hydrated: boolean;
}

type Action =
  | { type: "HYDRATE"; league: LeagueImport | null }
  | { type: "IMPORT_LEAGUE"; league: LeagueImport }
  | { type: "SET_MY_TEAM"; team: string | null }
  | { type: "CLEAR_LEAGUE" };

function reducer(state: LeagueState, action: Action): LeagueState {
  switch (action.type) {
    case "HYDRATE":
      return { league: action.league, hydrated: true };
    case "IMPORT_LEAGUE":
      return { ...state, league: action.league };
    case "SET_MY_TEAM":
      return state.league ? { ...state, league: { ...state.league, myTeam: action.team } } : state;
    case "CLEAR_LEAGUE":
      return { ...state, league: null };
    default:
      return state;
  }
}

interface LeagueContextValue {
  league: LeagueImport | null;
  hydrated: boolean;
  importLeague: (league: LeagueImport) => void;
  setMyTeam: (team: string | null) => void;
  clearLeagueData: () => void;
}

const LeagueCtx = createContext<LeagueContextValue | null>(null);

/** Stato delle rose di lega importate da CSV — deliberatamente separato da
 * `AstaContext` (chiave localStorage propria, `fanta_league_2627_v1`): sono
 * concetti diversi (10 rose finali della lega vs il proprio tracking "mine/
 * out/free" durante l'asta live), zero rischio di regressione sull'esistente. */
export function LeagueProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { league: null, hydrated: false });

  useEffect(() => {
    dispatch({ type: "HYDRATE", league: loadLeague() });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    if (state.league) saveLeague(state.league);
    else clearLeague();
  }, [state.hydrated, state.league]);

  const value = useMemo<LeagueContextValue>(
    () => ({
      league: state.league,
      hydrated: state.hydrated,
      importLeague: (league) => dispatch({ type: "IMPORT_LEAGUE", league }),
      setMyTeam: (team) => dispatch({ type: "SET_MY_TEAM", team }),
      clearLeagueData: () => dispatch({ type: "CLEAR_LEAGUE" }),
    }),
    [state.league, state.hydrated],
  );

  return <LeagueCtx.Provider value={value}>{children}</LeagueCtx.Provider>;
}

export function useLeague(): LeagueContextValue {
  const ctx = useContext(LeagueCtx);
  if (!ctx) throw new Error("useLeague must be used within LeagueProvider");
  return ctx;
}
