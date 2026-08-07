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
