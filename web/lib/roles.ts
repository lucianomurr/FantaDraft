import type { Role } from "./types";

export const ROLES: Role[] = ["P", "D", "C", "A"];

export const RTARGET: Record<Role, number> = { P: 3, D: 8, C: 8, A: 6 };

export const RNAME: Record<Role, string> = {
  P: "Portieri",
  D: "Difensori",
  C: "Centrocampisti",
  A: "Attaccanti",
};

/** CSS custom-property names carrying each role's accent color. */
export const RVAR: Record<Role, string> = {
  P: "--p",
  D: "--d",
  C: "--c",
  A: "--a",
};

/** Sottoruoli Mantra (schieramento) — distinti dal ruolo Classic d'asta sopra. */
export const MANTRA_ROLES = [
  "Por",
  "Dc",
  "Dd",
  "Ds",
  "B",
  "E",
  "M",
  "C",
  "W",
  "T",
  "Pc",
  "A",
] as const;

export const MRNAME: Record<string, string> = {
  Por: "Portiere",
  Dc: "Difensore centrale",
  Dd: "Terzino destro",
  Ds: "Terzino sinistro",
  B: "Braccetto",
  E: "Esterno",
  M: "Mediano",
  C: "Centrocampista",
  W: "Ala",
  T: "Trequartista",
  Pc: "Punta centrale",
  A: "Attaccante",
};
