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

/** Quanti giocatori per reparto pesano al 100% nel FVM della rosa — i
 * presunti titolari, l'unico gruppo che dà per certo il proprio contributo.
 * Il resto pesa TAIL_WEIGHT: un ottavo centrocampista probabilmente gioca
 * poco, non ha senso valutarlo come se fosse titolare fisso (indicazione di
 * Luciano, 04/09/2026 — P=1 perché in pratica gioca sempre un solo
 * portiere, D/C/A=3 come dimensione tipica di un reparto titolare). */
const TOP_N: Record<Role, number> = { P: 1, D: 3, C: 3, A: 3 };
const TAIL_WEIGHT = 0.25;

/** `players` deve già essere `DerivedPlayer[]` calcolato via `withDerivedAll`
 * (FVM Classic/Mantra già risolto in `p.f`) — qui si legge `p.f` direttamente,
 * stesso pattern già usato da lineup.ts/LineupModal.tsx.
 *
 * Il FVM della rosa NON è la somma piatta di tutti i FVM: per reparto, solo
 * i top `TOP_N[ruolo]` per FVM (i presunti titolari) contano al 100%, il
 * resto conta al `TAIL_WEIGHT` (25%) — una panchina profonda di riserve
 * costose non deve pesare come se giocasse sempre, il contributo nel corso
 * dell'anno non è scontato. `speso` resta la somma piena dei crediti pagati
 * (è un fatto, non una stima), solo il FVM è ponderato. */
export function computeTeamValueSummary(team: LeagueTeam, players: DerivedPlayer[]): TeamValueSummary {
  const byId = new Map(players.map((p) => [p.id, p]));
  const perRuolo: Record<Role, { speso: number; fvmTotale: number; count: number }> = {
    P: { speso: 0, fvmTotale: 0, count: 0 },
    D: { speso: 0, fvmTotale: 0, count: 0 },
    C: { speso: 0, fvmTotale: 0, count: 0 },
    A: { speso: 0, fvmTotale: 0, count: 0 },
  };
  const byRole: Record<Role, { p: DerivedPlayer; price: number }[]> = { P: [], D: [], C: [], A: [] };
  let speso = 0;
  let missing = 0;

  for (const { id, price } of team.players) {
    speso += price;
    const p = byId.get(id);
    if (!p) {
      missing++;
      continue;
    }
    byRole[p.r].push({ p, price });
  }

  let fvmTotale = 0;
  for (const role of Object.keys(byRole) as Role[]) {
    const group = byRole[role].sort((a, b) => b.p.f - a.p.f);
    group.forEach(({ p, price }, i) => {
      const weight = i < TOP_N[role] ? 1 : TAIL_WEIGHT;
      const fvmPesato = p.f * weight;
      perRuolo[role].speso += price;
      perRuolo[role].fvmTotale += fvmPesato;
      perRuolo[role].count++;
      fvmTotale += fvmPesato;
    });
  }
  fvmTotale = Math.round(fvmTotale);
  for (const role of Object.keys(perRuolo) as Role[]) {
    perRuolo[role].fvmTotale = Math.round(perRuolo[role].fvmTotale);
  }

  return { team: team.name, speso, fvmTotale, differenza: fvmTotale - speso, perRuolo, missing };
}

/** Classifica le squadre per "affare" (FVM ottenuto meno crediti spesi),
 * decrescente — chi ha pagato meno del valore reale della rosa è in cima. */
export function rankTeams(teams: LeagueTeam[], players: DerivedPlayer[]): TeamValueSummary[] {
  return teams.map((t) => computeTeamValueSummary(t, players)).sort((a, b) => b.differenza - a.differenza);
}
