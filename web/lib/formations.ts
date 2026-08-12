import type { Player } from "./types";

/** Pallini titolarità/ballottaggio per la colonna Tit e la scheda giocatore:
 * pieno = titolare in quella fonte, semipieno = citato in ballottaggio in
 * quella fonte senza essere titolare altrove (vedi scripts/build_formazioni.py
 * per come tit/ball vengono calcolati, mutuamente esclusivi per fonte), vuoto
 * = né l'uno né l'altro. tit + ballOnly non supera mai numFormSources. */
export interface TitBallDots {
  tit: number;
  ballOnly: number;
  empty: number;
  titCls: "tit3" | "tit2" | "tit1" | "tit0";
  title: string;
}

export function titBallDots(p: Player, numFormSources: number): TitBallDots {
  const majority = Math.ceil(numFormSources / 2);
  const titCls =
    p.tit === numFormSources ? "tit3" : p.tit >= majority ? "tit2" : p.tit >= 1 ? "tit1" : "tit0";
  const empty = Math.max(0, numFormSources - p.tit - p.ball);
  const title =
    `Titolare in ${p.tit}/${numFormSources} formazioni tipo` +
    (p.ball > 0 ? ` · in ballottaggio (non titolare) in altre ${p.ball}` : "");
  return { tit: p.tit, ballOnly: p.ball, empty, titCls, title };
}
