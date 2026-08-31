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

/** Budget di riferimento su cui sono tarate le percentuali sotto — la lega
 * standard di questo progetto è 500 crediti. Se l'utente usa un totale
 * diverso, il prezzo consigliato si riscala in proporzione. */
const REFERENCE_BUDGET = 500;

/** % del budget TOTALE (non del reparto) per il 1° slot di ogni ruolo — medie
 * dei range indicati da Luciano su dati reali di lega Classic: Attacco
 * 32-38%→35%, Centrocampo 10-12%→11%, Portiere 8-10%→9%, Difesa 7-8%→7.5%. */
const SLOT1_PCT: Record<Role, number> = { P: 0.09, D: 0.075, C: 0.11, A: 0.35 };

/** Calo dal 1° al 2° slot dello stesso ruolo — dai dati di Luciano per
 * l'attacco (2° slot 10-14%→12%, su un 1° slot 35%) il rapporto è ~0.34;
 * usato per tutti i ruoli in mancanza di un 2° dato per P/D/C. */
const SLOT_DROP_1_2 = 0.35;

/** Calo per ogni slot successivo al 2° — più dolce del primo salto: gli slot
 * di profondità (3°-8°) sono opzioni via via più economiche ma NON devono
 * crollare quasi a zero, restano comunque titolari plausibili. Nessun dato
 * di Luciano li copre esplicitamente — euristica dichiarata, da ritarare. */
const SLOT_DROP_REST = 0.68;

/** Bonus "appetibilità" in percentuale (non a credito fisso) per rigoristi:
 * +15% il designato, +5% l'alternativa — stessa idea del bonus già usato per
 * le fasce, riscritta come moltiplicatore come richiesto da Luciano. */
const PEN_BONUS: Record<number, number> = { 1: 1.15, 2: 1.05 };

/** Peso del prezzo per lo slot n-esimo di un ruolo (rank 0-based), come
 * frazione del budget TOTALE — non normalizzato, non deve sommare a niente:
 * ogni slot ha un target indicativo indipendente, non una fetta di torta. */
function slotSharePct(rank: number, slot1Pct: number): number {
  if (rank === 0) return slot1Pct;
  if (rank === 1) return slot1Pct * SLOT_DROP_1_2;
  return slot1Pct * SLOT_DROP_1_2 * Math.pow(SLOT_DROP_REST, rank - 1);
}

/** Prezzo target consigliato = Budget totale × % indicativa per slot di
 * ruolo (SLOT1_PCT poi a scendere), NON diviso per numero di candidati F1-F4
 * né per budget di reparto — un giocatore forte vale quello che vale a
 * prescindere da quanti altri candidati ci sono nel suo ruolo. I giocatori
 * F1-F4 sono ordinati con lo stesso punteggio usato per le fasce, cosí lo
 * slot 1 è coerente con chi è "primo" per fascia. Bonus rigorista in
 * percentuale (PEN_BONUS). Fascia R fissa a 1 credito; fascia X (evita) e
 * senza fascia non hanno un prezzo (non li stai comprando). Le percentuali
 * sono indicative per slot, non un budget da esaurire: sommate insieme
 * possono superare il budget del reparto — normale, non comprerai mai tutti
 * i candidati F1-F4, solo i migliori che riesci a portare a casa. Non tiene
 * conto del numero di partecipanti alla lega (più squadre = più concorrenza
 * = prezzi reali più alti): il progetto non ha un dato tracciabile per
 * quantificarlo, resterebbe un numero inventato. */
export function computeLivePrices(
  players: Player[],
  tierMap: Record<number, Tier>,
  cfg: { budget: number },
  params: PresetParams,
): Record<number, number> {
  const totalBudget = cfg.budget || REFERENCE_BUDGET;
  const prices: Record<number, number> = {};
  const byRole: Record<Role, Player[]> = { P: [], D: [], C: [], A: [] };
  for (const p of players) byRole[p.r].push(p);

  for (const r of ROLES) {
    const tiered = byRole[r]
      .filter((p) => {
        const t = tierMap[p.id];
        return t === "1" || t === "2" || t === "3" || t === "4";
      })
      .sort((a, b) => score(b, params) - score(a, params));

    tiered.forEach((p, rank) => {
      let price = slotSharePct(rank, SLOT1_PCT[r]) * totalBudget;
      if (p.pen === 1) price *= PEN_BONUS[1];
      else if (p.pen === 2) price *= PEN_BONUS[2];
      prices[p.id] = Math.max(2, Math.round(price));
    });
  }
  for (const p of players) {
    if (tierMap[p.id] === "R") prices[p.id] = 1;
  }
  return prices;
}

export function countByTier(tierMap: Record<number, Tier>): Record<Tier, number> {
  const out: Record<Tier, number> = { "1": 0, "2": 0, "3": 0, "4": 0, R: 0, X: 0 };
  for (const t of Object.values(tierMap)) out[t]++;
  return out;
}
