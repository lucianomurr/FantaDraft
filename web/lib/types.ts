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
}

export interface GiornataMeta {
  periodo: string | null;
  aggiornato: string;
}

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
}

export interface PersistedState {
  cfg: RoleAllocation;
  st: TrackingState;
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
