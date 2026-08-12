import type { Player, DerivedPlayer, Role } from "./types";

/** Peso dei gol per ruolo nel calcolo di Val: un gol da difensore è molto più raro
 * (quindi più prezioso per differenziarsi) di uno da attaccante. Derivato dai gol/
 * giocatore medi reali della rosa 2025/26 (D 1.11, C 2.20, A 5.11 — scarto ~4.6x/2.3x),
 * non da una regola fantacalcistica ufficiale: gli assist restano a peso 1 perché la
 * differenza tra ruoli è molto più piccola (D 1.07, C 1.82, A 1.96 assist/giocatore). */
const GOAL_ROLE_WEIGHT: Record<Role, number> = { P: 1, D: 4.6, C: 2.3, A: 1 };

/** Val = bonus attesi (3×gol×peso_ruolo + assist) per 100 crediti di FVM. Solo se stat=true e FVM>0.
 * Portieri: nessun gol/assist, quindi si usa (100 − gol subiti) al posto del bonus —
 * gol subiti individuali reali (Serie A 2025/26, copiati a mano dalla tabella "Player
 * Goalkeeping" di FBref: lo scraping automatico è bloccato da CAPTCHA persistente su
 * tutto fbref.com). Per le squadre promosse dalla B senza dato individuale: proxy di
 * squadra prorata sui minuti (vedi `gaIndividual` e scripts/merge_keeper_ga.py). */
export function computeVal(p: Player): number | null {
  if (!p.stat || !p.f || p.f <= 0) return null;
  if (p.r === "P") {
    // sotto i 900 min il gol-subiti-prorata è troppo vicino a 0 per essere
    // affidabile (non è che il portiere sia forte, è che ha giocato poco).
    // Sotto 3 di FVM il rapporto esplode (portieri di riserva quasi gratis
    // con minuti reali) senza dire niente sul portiere: fuori dal confronto.
    if (p.ga == null || (p.min ?? 0) < 900 || p.f < 3) return null;
    return Math.round(((100 - p.ga) / p.f) * 100);
  }
  const gls = p.gls ?? 0;
  const ast = p.ast ?? 0;
  return Math.round(((3 * gls * GOAL_ROLE_WEIGHT[p.r] + ast) / p.f) * 100);
}

/** FVM da usare per punteggi/ordinamento: Mantra (`fvmM`) se la lega è Mantra
 * e il dato è presente, altrimenti Classic (`f`). */
export function activeFvm(p: Player, mantra: boolean): number {
  return mantra && p.fvmM != null ? p.fvmM : p.f;
}

export function withDerived(p: Player, mantra: boolean): DerivedPlayer {
  const adjusted = { ...p, f: activeFvm(p, mantra) };
  return { ...adjusted, val: computeVal(adjusted) };
}

export function withDerivedAll(players: Player[], mantra: boolean): DerivedPlayer[] {
  return players.map((p) => withDerived(p, mantra));
}

export type XgFlag = "under" | "over" | null;

/** Segnala under/overperformer xG (soglia 2 gol di scarto, campione >=900 min per ridurre il rumore). */
export function xgFlag(p: Player): XgFlag {
  if (p.xg == null || p.min == null || p.min < 900) return null;
  const diff = (p.gls ?? 0) - p.xg;
  if (diff <= -2) return "under";
  if (diff >= 2) return "over";
  return null;
}

/** Val alto (>=50) ma campione piccolo (<900 min): forte scommessa. */
export function isSmallSampleBet(p: DerivedPlayer): boolean {
  return p.val != null && p.val >= 50 && (p.min ?? 0) < 900;
}
