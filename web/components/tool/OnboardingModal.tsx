"use client";

import { useEffect, useState } from "react";
import { useAsta } from "../../contexts/AstaContext";
import { STRATEGIES, distributeBudget } from "../../lib/strategies";
import type { StrategyDef } from "../../lib/types";
import { ModalShell } from "./ModalShell";

type Step = 1 | 2 | 3;

export function OnboardingModal({
  open,
  onClose,
  onOpenPreset,
}: {
  open: boolean;
  onClose: () => void;
  onOpenPreset: () => void;
}) {
  const { setCfg, toast } = useAsta();
  const [step, setStep] = useState<Step>(1);
  const [budgetInput, setBudgetInput] = useState("500");
  const [mantra, setMantra] = useState(false);
  const [modDifesa, setModDifesa] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setMantra(false);
      setModDifesa(false);
    }
  }, [open]);

  function confirmBudget(strat: StrategyDef) {
    let budget = +budgetInput;
    if (!(budget > 0)) budget = 500;
    const alloc = distributeBudget(budget, strat);
    setCfg(alloc);
    toast(`Budget impostato: ${budget} cr · strategia ${strat.label}`);
    setStep(2);
  }

  function confirmRules() {
    setCfg({ mantra, modDifesa });
    toast(`Lega ${mantra ? "Mantra" : "Classic"}${modDifesa ? " + modificatore difesa" : ""}`);
    setStep(3);
  }

  function finishWithPreset() {
    onClose();
    onOpenPreset();
  }

  return (
    <ModalShell open={open} onClose={onClose}>
      {step === 1 && (
        <>
          <div className="phead">
            <h3>⚽ Benvenuto</h3>
          </div>
          <p className="pmeta" style={{ fontSize: 13 }}>
            Quanti crediti hai per la tua asta, e con che strategia vuoi ripartirli sui 4 reparti?
            Percentuali tarate su una lega da 10 squadre. Potrai comunque modificare ogni valore
            dopo, dal pannello &quot;Budget &amp; allocazione&quot;.
          </p>
          <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "14px 0 16px" }}>
            <label className="hint" style={{ fontSize: 13 }}>
              Crediti totali
            </label>
            <input
              type="number"
              min={1}
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              className="tin"
              style={{ width: 90, fontSize: 15, padding: "8px 10px" }}
            />
          </div>
          <div className="stratgrid">
            {STRATEGIES.map((s) => (
              <div className="stratcard" key={s.key} onClick={() => confirmBudget(s)}>
                <h4>
                  {s.label}
                  {s.key === "equilibrio" && (
                    <span className="pill" style={{ fontSize: 9 }}>
                      consigliata
                    </span>
                  )}
                </h4>
                <div className="stratpct">
                  <span style={{ color: "var(--p)" }}>P {s.P}%</span>
                  <span style={{ color: "var(--d)" }}>D {s.D}%</span>
                  <span style={{ color: "var(--c)" }}>C {s.C}%</span>
                  <span style={{ color: "var(--a)" }}>A {s.A}%</span>
                </div>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="hint" style={{ marginTop: 12 }}>
            Strategie adattate dalla guida di Giosuè Fichera (forum Gruppo Esperti) — dettagli nel
            promemoria d&apos;asta.
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="phead">
            <h3>📋 Che lega giochi?</h3>
          </div>
          <p className="pmeta" style={{ fontSize: 13 }}>
            Cambia parecchio la strategia: in Mantra ogni giocatore ha più sottoruoli e un FVM
            proprio, col modificatore difesa portieri e difensori valgono di più. Incide sul
            calcolo del preset fasce.
          </p>
          <div className="stratgrid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            <div className={`stratcard${!mantra ? " on" : ""}`} onClick={() => setMantra(false)}>
              <h4>Classic</h4>
              <p>Un ruolo per giocatore (P/D/C/A), un solo FVM. Il formato più comune.</p>
            </div>
            <div className={`stratcard${mantra ? " on" : ""}`} onClick={() => setMantra(true)}>
              <h4>Mantra</h4>
              <p>Sottoruoli multipli per giocatore, FVM Mantra dedicato, più flessibilità in formazione.</p>
            </div>
          </div>
          <label className="chk" style={{ margin: "16px 0" }}>
            <input
              type="checkbox"
              checked={modDifesa}
              onChange={(e) => setModDifesa(e.target.checked)}
            />
            Modificatore difesa attivo (bonus/malus legato alla difesa della squadra)
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="pri" onClick={confirmRules}>
              Continua
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="phead">
            <h3>✨ Precompiliamo le fasce?</h3>
          </div>
          <p className="pmeta" style={{ fontSize: 13 }}>
            Posso proporre subito una preselezione di fasce (1-4/R/X) tarata su{" "}
            {mantra ? "Mantra" : "Classic"}
            {modDifesa ? " con modificatore difesa" : ""} — resta tutta rivedibile e non tocca le
            fasce che scegli a mano. Puoi anche farlo più tardi dal bottone &quot;Preset
            fasce&quot;.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button className="pri" onClick={finishWithPreset}>
              Sì, apri il preset fasce
            </button>
            <button className="ghost" onClick={onClose}>
              Salta, lo faccio dopo
            </button>
          </div>
        </>
      )}
    </ModalShell>
  );
}
