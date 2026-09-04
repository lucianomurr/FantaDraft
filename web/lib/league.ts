import type { DerivedPlayer, LeagueImport, LeagueTeam, Role } from "./types";

/** Parsa l'export CSV rose di leghe.fantacalcio.it: niente header singolo —
 * righe "$,$,$" ripetute come separatore tra un blocco squadra e l'altro (una
 * per squadra). Ogni riga dati è `teamName,playerId,creditiPagati`. */
export function parseRosterCsv(text: string, validIds: Set<number>): LeagueImport {
  const teams = new Map<string, { id: number; price: number }[]>();
  const unmatched: { team: string; id: number }[] = [];

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const cols = line.split(",").map((c) => c.trim());
    if (cols.length < 3 || cols[0] === "$") continue;
    const team = cols[0];
    const id = parseInt(cols[1], 10);
    const price = parseInt(cols[2], 10);
    if (!team || Number.isNaN(id) || Number.isNaN(price)) continue;
    if (!validIds.has(id)) {
      unmatched.push({ team, id });
      continue;
    }
    if (!teams.has(team)) teams.set(team, []);
    teams.get(team)!.push({ id, price });
  }

  const teamsArr: LeagueTeam[] = Array.from(teams.entries()).map(([name, players]) => ({ name, players }));
  return { importedAt: new Date().toISOString(), teams: teamsArr, myTeam: null, unmatched };
}

export interface TeamValueSummary {
  team: string;
  speso: number;
  fvmTotale: number;
  differenza: number;
  perRuolo: Record<Role, { speso: number; fvmTotale: number; count: number }>;
  /** Giocatori del CSV non trovati nella lista corrente (dataset cambiato nel frattempo). */
  missing: number;
}

/** `players` deve già essere `DerivedPlayer[]` calcolato via `withDerivedAll`
 * (FVM Classic/Mantra già risolto in `p.f`) — qui si legge `p.f` direttamente,
 * stesso pattern già usato da lineup.ts/LineupModal.tsx. */
export function computeTeamValueSummary(team: LeagueTeam, players: DerivedPlayer[]): TeamValueSummary {
  const byId = new Map(players.map((p) => [p.id, p]));
  const perRuolo: Record<Role, { speso: number; fvmTotale: number; count: number }> = {
    P: { speso: 0, fvmTotale: 0, count: 0 },
    D: { speso: 0, fvmTotale: 0, count: 0 },
    C: { speso: 0, fvmTotale: 0, count: 0 },
    A: { speso: 0, fvmTotale: 0, count: 0 },
  };
  let speso = 0;
  let fvmTotale = 0;
  let missing = 0;

  for (const { id, price } of team.players) {
    speso += price;
    const p = byId.get(id);
    if (!p) {
      missing++;
      continue;
    }
    fvmTotale += p.f;
    perRuolo[p.r].speso += price;
    perRuolo[p.r].fvmTotale += p.f;
    perRuolo[p.r].count++;
  }

  return { team: team.name, speso, fvmTotale, differenza: fvmTotale - speso, perRuolo, missing };
}

/** Classifica le squadre per "affare" (FVM ottenuto meno crediti spesi),
 * decrescente — chi ha pagato meno del valore reale della rosa è in cima. */
export function rankTeams(teams: LeagueTeam[], players: DerivedPlayer[]): TeamValueSummary[] {
  return teams.map((t) => computeTeamValueSummary(t, players)).sort((a, b) => b.differenza - a.differenza);
}
