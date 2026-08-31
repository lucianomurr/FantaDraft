import type { Player, Role, Tier } from "./types";
import { ROLES, RTARGET } from "./roles";
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

/** Quanto ripidamente scende il prezzo dal 1° slot del reparto in giù (slot
 * successivo = slot precedente × questo fattore, poi tutto normalizzato sul
 * budget del reparto). Basso = "effetto superstar" forte (il titolare
 * assoluto mangia gran parte del budget, i posti dietro costano quasi
 * niente): tipico di portiere (blocco squadra) e attacco (bomber da
 * doppia cifra). Alto = reparto più "piatto"/intercambiabile: tipico di
 * centrocampo e difesa, dove il 2°-3° titolare vale quasi quanto il 1°.
 * Euristica calibrata a occhio sulle % tipiche di prezzo per slot di una
 * lega Classic standard — da ritarare, non una formula certificata. */
const SLOT_DECAY: Record<Role, number> = { P: 0.35, D: 0.45, C: 0.5, A: 0.35 };

/** Pesi normalizzati (sommano a 1) per gli `slots` titolari di un reparto,
 * dal più caro al più economico, secondo la curva SLOT_DECAY. */
function slotWeights(slots: number, decay: number): number[] {
  const raw = Array.from({ length: slots }, (_, i) => Math.pow(decay, i));
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((w) => w / sum);
}

/** Prezzo target consigliato: il budget del reparto (cfg[ruolo]) si spalma
 * sugli `slots` posti di ruolo (3 P, 8 D, 8 C, 6 A) con un peso decrescente
 * per slot (SLOT_DECAY) — il 1° titolare del reparto prende una fetta molto
 * più grande dell'ultimo, non una quota piatta. I giocatori F1-F4 vengono
 * ordinati con lo STESSO punteggio usato per assegnare le fasce, cosí chi è
 * "primo" per prezzo è coerente con chi è "primo" per fascia; oltre l'ultimo
 * slot (candidati di scorta in fascia 3-4) prendono tutti il prezzo
 * dell'ultimo slot, un valore basso da riserva. Fascia R fissa a 1 credito;
 * fascia X (evita) e senza fascia non hanno un prezzo (non li stai
 * comprando). È un punto di partenza da aggiustare all'asta in base a come
 * sale realmente il prezzo, non una previsione di spesa garantita. */
export function computeLivePrices(
  players: Player[],
  tierMap: Record<number, Tier>,
  cfg: Record<Role, number>,
  params: PresetParams,
): Record<number, number> {
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
    if (tiered.length === 0) continue;

    const budget = cfg[r] ?? 0;
    const slots = RTARGET[r];
    const weights = slotWeights(slots, SLOT_DECAY[r]);
    const tailWeight = weights[weights.length - 1];

    tiered.forEach((p, rank) => {
      const w = rank < slots ? weights[rank] : tailWeight;
      prices[p.id] = Math.max(1, Math.round(w * budget));
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
