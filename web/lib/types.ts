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
  ball: 0 | 1;
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
