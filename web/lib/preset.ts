import type { Player, Role, Tier } from "./types";
import { ROLES } from "./roles";
import { activeFvm } from "./scoring";

export interface PresetParams {
  /** Peso della titolarità (0-5 fonti) nel punteggio: FVM × (0.55 + titWeight×tit). Default 0.15. */
  titWeight: number;
  /** Moltiplicatore delle soglie R/X: >1 = più aggressivo (più giocatori in R e in X), <1 = più conservativo. Default 1. */
  rxAggressiveness: number;
  /** Quote F1..F4 per ruolo: quanti dei migliori per punteggio finiscono in ciascuna fascia. */
  quotas: Record<Role, [number, number, number, number]>;
  /** Lega Mantra: usa il FVM Mantra (fvmM) invece del Classic dove disponibile. */
  mantra: boolean;
  /** Modificatore difesa attivo: pesa di più portieri/difensori nel punteggio. */
  modDifesa: boolean;
}

/** Euristica regolabile: quanto pesano di più P/D quando il modificatore
 * difesa è attivo (premia le squadre forti in difesa più del solito). Non è
 * una formula fantacalcistica certificata — da ritarare a occhio sull'uso
 * reale, stesso spirito delle altre costanti di questo file. */
const MODDIFESA_BOOST: Record<Role, number> = { P: 1.15, D: 1.2, C: 1, A: 1 };

export const DEFAULT_QUOTAS: Record<Role, [number, number, number, number]> = {
  P: [3, 4, 5, 0],
  D: [5, 7, 8, 8],
  C: [5, 7, 8, 8],
  A: [4, 6, 8, 8],
};

export const DEFAULT_PRESET_PARAMS: PresetParams = {
  titWeight: 0.15,
  rxAggressiveness: 1,
  quotas: DEFAULT_QUOTAS,
  mantra: false,
  modDifesa: false,
};

// Soglie base (aggressività 1x) per la fascia R (titolari economici) e X (trappole
// costose non titolari), calibrate per ruolo sul FVM.
const R_MAXFVM_BASE: Record<Role, number> = { P: 15, D: 6, C: 6, A: 10 };
const X_MINFVM_BASE: Record<Role, number> = { P: 20, D: 20, C: 25, A: 40 };

function score(p: Player, params: PresetParams): number {
  const fvm = activeFvm(p, params.mantra);
  let s = fvm * (0.55 + params.titWeight * p.tit);
  if (params.modDifesa) s *= MODDIFESA_BOOST[p.r];
  if (p.pen === 1) s += 12;
  else if (p.pen === 2) s += 4;
  return s;
}

/** Ricalcola le fasce suggerite interamente nel browser, secondo i parametri
 * scelti dall'utente nella modale Preset fasce. Stessa logica di
 * scripts/preset_fasce.py, ma con pesi/soglie/quote regolabili invece che fissi. */
export function computeLivePreset(players: Player[], params: PresetParams): Record<number, Tier> {
  const result: Record<number, Tier> = {};
  const byRole: Record<Role, Player[]> = { P: [], D: [], C: [], A: [] };
  for (const p of players) byRole[p.r].push(p);

  for (const r of ROLES) {
    const pool = [...byRole[r]].sort((a, b) => score(b, params) - score(a, params));
    const quotas = params.quotas[r];
    const tiers: Tier[] = ["1", "2", "3", "4"];
    let i = 0;
    for (let ti = 0; ti < 4; ti++) {
      for (let k = 0; k < quotas[ti] && i < pool.length; k++, i++) {
        result[pool[i].id] = tiers[ti];
      }
    }
    const rMax = R_MAXFVM_BASE[r] * params.rxAggressiveness;
    const xMin = X_MINFVM_BASE[r] / params.rxAggressiveness;
    for (; i < pool.length; i++) {
      const p = pool[i];
      const fvm = activeFvm(p, params.mantra);
      if (p.tit >= 2 && fvm <= rMax) result[p.id] = "R";
      else if (p.tit === 0 && fvm >= xMin && p.pen !== 1) result[p.id] = "X";
    }
  }
  return result;
}

/** Budget di riferimento su cui sono tarate le quotazioni ufficiali (FVM) —
 * la lega standard di questo progetto è 500 crediti. Se l'utente usa un
 * totale diverso, il prezzo consigliato si riscala in proporzione. */
const REFERENCE_BUDGET = 500;

/** Prezzo target consigliato = FVM del giocatore (già definito nel progetto
 * come "stima del prezzo d'asta", non un punteggio interno) riscalato sul
 * budget totale scelto dall'utente se diverso dai 500 crediti standard, più
 * lo stesso piccolo bonus rigorista già usato per le fasce (+12/+4 crediti,
 * anch'esso riscalato). NESSUNA divisione per budget di reparto: un
 * giocatore forte vale quello che vale a prescindere da quanti altri
 * candidati F1-F4 ci sono nel suo ruolo — dividere il budget del reparto tra
 * tutti quei candidati (prima versione di questa funzione) schiacciava il
 * prezzo di ogni singolo top player ben sotto il suo valore reale, tanto più
 * quanti più candidati aveva quel reparto. Fascia R fissa a 1 credito;
 * fascia X (evita) e senza fascia non hanno un prezzo (non li stai
 * comprando). Non tiene conto del numero di partecipanti alla lega (più
 * squadre = più concorrenza = prezzi reali più alti) — il FVM ufficiale non
 * lo scompone per taglia di lega, quindi neanche questa stima può farlo
 * senza inventare un fattore non tracciabile a una fonte reale. */
export function computeLivePrices(
  players: Player[],
  tierMap: Record<number, Tier>,
  cfg: { budget: number },
  params: PresetParams,
): Record<number, number> {
  const scale = (cfg.budget || REFERENCE_BUDGET) / REFERENCE_BUDGET;
  const prices: Record<number, number> = {};
  for (const p of players) {
    const t = tierMap[p.id];
    if (t === "R") {
      prices[p.id] = 1;
      continue;
    }
    if (t !== "1" && t !== "2" && t !== "3" && t !== "4") continue;
    let price = activeFvm(p, params.mantra) * scale;
    if (p.pen === 1) price += 12 * scale;
    else if (p.pen === 2) price += 4 * scale;
    prices[p.id] = Math.max(1, Math.round(price));
  }
  return prices;
}

export function countByTier(tierMap: Record<number, Tier>): Record<Tier, number> {
  const out: Record<Tier, number> = { "1": 0, "2": 0, "3": 0, "4": 0, R: 0, X: 0 };
  for (const t of Object.values(tierMap)) out[t]++;
  return out;
}
