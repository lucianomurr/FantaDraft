"use client";

import { useState } from "react";
import { useAsta } from "../../contexts/AstaContext";
import { STRATEGIES } from "../../lib/strategies";
import { distributeBudget } from "../../lib/strategies";
import type { StrategyDef } from "../../lib/types";
import { ModalShell } from "./ModalShell";

export function OnboardingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { setCfg, toast } = useAsta();
  const [budgetInput, setBudgetInput] = useState("500");

  function confirm(strat: StrategyDef) {
    let budget = +budgetInput;
    if (!(budget > 0)) budget = 500;
    const alloc = distributeBudget(budget, strat);
    setCfg(alloc);
    toast(`Budget impostato: ${budget} cr · strategia ${strat.label}`);
    onClose();
  }

  return (
    <ModalShell open={open} onClose={onClose}>
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
          <div className="stratcard" key={s.key} onClick={() => confirm(s)}>
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
    </ModalShell>
  );
}
