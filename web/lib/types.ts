export type Role = "P" | "D" | "C" | "A";
export type Tier = "1" | "2" | "3" | "4" | "R" | "X";
export type Status = "free" | "mine" | "out";
export type PenType = 0 | 1 | 2;

export interface SeasonHist {
  sea: string;
  lg: string;
  tm: string;
  mp: number;
  st: number;
  min: number;
  gls: number;
  ast: number;
  pk: number;
  pka: number;
}

export interface Player {
  id: number;
  r: Role;
  n: string;
  s: string;
  q: number;
  f: number;
  pen: PenType;
  tit: number;
  /** In quante fonti è citato in un ballottaggio SENZA essere titolare in quella
   * stessa fonte (0..numFormSources). tit + ball non supera mai numFormSources. */
  ball: number;
  gls?: number;
  ast?: number;
  pk?: number;
  pkatt?: number;
  min?: number;
  mp?: number;
  starts?: number;
  sea?: string;
  src?: string;
  stat: boolean;
  nat?: string | null;
  born?: number | null;
  hist?: SeasonHist[];
  pt?: Tier | "";
  xg?: number | null;
  xa?: number | null;
  npxg?: number | null;
  sh?: number;
  kp?: number;
  inj?: { d: string; r: string } | null;
  transfer?: TransferEvent | null;
  /** Ruoli Mantra (es. ["Dd","Dc"]) — sottoruoli di schieramento, distinti dal ruolo Classic `r`. */
  rm?: string[];
  /** FVM Mantra, spesso diverso dal FVM Classic `f`. */
  fvmM?: number | null;
  /** Solo portieri: gol subiti 2025/26 — individuali reali se `gaIndividual`, altrimenti
   * proxy di squadra (promosse dalla B) prorata sui minuti giocati. */
  ga?: number | null;
  /** Solo portieri, solo se non individuale: gol subiti totali della squadra 2025/26
   * dietro la proroga di `ga`. */
  gaTeam?: number | null;
  /** true = `ga` è il dato individuale reale del portiere, false = proxy di squadra. */
  gaIndividual?: boolean;
  /** Probabilità di titolarità (0-100) per la GIORNATA CORRENTE, da SOS Fanta —
   * a differenza di `tit` (conteggio 0-6 fonti, preview stagionale) è specifica
   * della prossima giornata e va ri-fetchata ogni settimana. Assente se il
   * giocatore non è stato agganciato in quel fetch. */
  startPct?: number | null;
  /** Id del giocatore rivale in un ballottaggio per la maglia nella giornata
   * corrente, se presente (stessa fonte di startPct). */
  ballotRival?: number | null;
}

export interface GiornataMeta {
  periodo: string | null;
  aggiornato: string;
  /** Fonti incrociate per startPct (es. ["SOS Fanta", "Gazzetta"]) — assente
   * nei giornata.json generati prima che se ne aggiungesse una seconda. */
  fonti?: string[];
}

/** Gol fatti/subiti di squadra nella stagione in corso — campione piccolo
 * per definizione a inizio anno, usato solo come correttivo minore. */
export interface TeamStanding {
  mp: number;
  gf: number;
  ga: number;
}
export type Standings = Record<string, TeamStanding>;

/** Avversario della giornata corrente per squadra. */
export interface Matchup {
  opp: string;
  home: boolean;
}
export type Matchups = Record<string, Matchup>;

export interface TransferEvent {
  dir: "in" | "out";
  date: string; // YYYY-MM-DD
  from?: string; // presente se dir === "in"
  to?: string; // presente se dir === "out"
  type: string; // "Transfer" | "Loan" | "Free" | "Free agent" | "Return from loan" | ...
}

/** Player enriched at runtime with derived, non-persisted fields. */
export interface DerivedPlayer extends Player {
  val: number | null;
}

export interface FormationXIEntry {
  id: number | null;
  n: string;
  r: Role | "?";
}

export interface TeamFormation {
  mod: string;
  xi: FormationXIEntry[];
  ball: string[][];
}

export interface FormationSource {
  name: string;
  teams: Record<string, TeamFormation>;
}

export interface FormazioniData {
  sources: FormationSource[];
}

/** Per-player asta tracking state. */
export interface PlayerState {
  t: Tier | null;
  tgt: number | null;
  s: Status;
  p: number | null;
  /** Preferenza personale ("stellina") — indipendente da fascia/stato, solo per
   * ritrovare al volo i giocatori che vuoi tenere d'occhio durante l'asta. */
  fav: boolean;
}

export type TrackingState = Record<number, PlayerState>;

export interface RoleAllocation {
  budget: number;
  P: number;
  D: number;
  C: number;
  A: number;
  /** Formato lega: Classic (false) o Mantra (true) — influenza FVM attivo e preset fasce. */
  mantra: boolean;
  /** Modificatore difesa attivo — pesa di più portieri/difensori nel preset fasce. */
  modDifesa: boolean;
  /** Quanti slot di rosa per ruolo (default 3P/8D/8C/6A, configurabile per leghe
   * con regole diverse) — separato dall'allocazione crediti P/D/C/A sopra. */
  slots: Record<Role, number>;
}

export interface PersistedState {
  cfg: RoleAllocation;
  st: TrackingState;
}

/** Una squadra della lega importata da CSV (leghe.fantacalcio.it), con i
 * giocatori posseduti e il prezzo pagato in asta. */
export interface LeagueTeam {
  name: string;
  players: { id: number; price: number }[];
}

/** Rose di TUTTA la lega, importate da CSV — stato indipendente dal proprio
 * tracking d'asta (`TrackingState`): qui si rappresentano le 10 squadre
 * finali, non "mine/out/free" durante l'asta live. */
export interface LeagueImport {
  importedAt: string; // ISO date
  teams: LeagueTeam[];
  myTeam: string | null;
  /** Righe del CSV il cui playerId non è stato trovato nel listone corrente. */
  unmatched: { team: string; id: number }[];
}

export interface FilterState {
  role: Role | "ALL";
  q: string;
  team: string;
  tier: string; // '', '1'..'4', 'R', 'tiered', 'none'
  hideOut: boolean;
  onlyMine: boolean;
  onlyPen: boolean;
  onlyTit: boolean;
  onlyFav: boolean;
  /** Filtro ruolo Mantra (uno dei MANTRA_ROLES) — "" = tutti. */
  mrole: string;
}

export type SortKey =
  | "n"
  | "s"
  | "q"
  | "f"
  | "gls"
  | "pk"
  | "ast"
  | "xg"
  | "xa"
  | "min"
  | "val"
  | "tit";

export interface SortState {
  key: SortKey;
  dir: 1 | -1;
}

export interface StrategyDef {
  key: "equilibrio" | "attacco" | "difesa";
  label: string;
  P: number;
  D: number;
  C: number;
  A: number;
  desc: string;
}
