"use client";

import { useEffect, useMemo, useState } from "react";
import { useAsta } from "../../contexts/AstaContext";
import { computeLivePreset, countByTier, DEFAULT_PRESET_PARAMS } from "../../lib/preset";
import type { PresetParams } from "../../lib/preset";
import { RNAME } from "../../lib/roles";
import type { Player, Role, Tier } from "../../lib/types";
import { ModalShell } from "./ModalShell";

const ROLE_ORDER: Role[] = ["P", "D", "C", "A"];
const TIER_LABELS: { key: Tier; label: string; color: string }[] = [
  { key: "1", label: "F1", color: "var(--f1)" },
  { key: "2", label: "F2", color: "var(--f2)" },
  { key: "3", label: "F3", color: "var(--f3)" },
  { key: "4", label: "F4", color: "var(--f4)" },
  { key: "R", label: "R", color: "var(--fr)" },
  { key: "X", label: "X", color: "var(--fx)" },
];

function cloneParams(p: PresetParams): PresetParams {
  return {
    titWeight: p.titWeight,
    rxAggressiveness: p.rxAggressiveness,
    quotas: {
      P: [...p.quotas.P] as [number, number, number, number],
      D: [...p.quotas.D] as [number, number, number, number],
      C: [...p.quotas.C] as [number, number, number, number],
      A: [...p.quotas.A] as [number, number, number, number],
    },
  };
}

export function PresetModal({
  players,
  open,
  onClose,
}: {
  players: Player[];
  open: boolean;
  onClose: () => void;
}) {
  const { applyComputedPreset } = useAsta();
  const [params, setParams] = useState<PresetParams>(() => cloneParams(DEFAULT_PRESET_PARAMS));
  const [resetFirst, setResetFirst] = useState(false);

  useEffect(() => {
    if (open) {
      setParams(cloneParams(DEFAULT_PRESET_PARAMS));
      setResetFirst(false);
    }
  }, [open]);

  const tierMap = useMemo(() => computeLivePreset(players, params), [players, params]);
  const counts = useMemo(() => countByTier(tierMap), [tierMap]);

  function setQuota(role: Role, tierIdx: number, value: number) {
    setParams((prev) => {
      const next = cloneParams(prev);
      next.quotas[role][tierIdx] = Math.max(0, value);
      return next;
    });
  }

  function confirm() {
    applyComputedPreset(tierMap, resetFirst);
    onClose();
  }

  return (
    <ModalShell open={open} onClose={onClose}>
      <button className="ghost sm xclose" onClick={onClose}>
        ✕
      </button>
      <div className="phead">
        <h3>✨ Preset fasce</h3>
      </div>
      <p className="pmeta" style={{ fontSize: 13 }}>
        Punteggio = FVM × (0,55 + peso titolarità × titolarità) + bonus rigorista. I migliori
        per punteggio (per quota di ruolo) prendono F1..F4; i titolari economici rimasti
        prendono R, le trappole costose e panchinare prendono X.
      </p>

      <div className="legsec">
        <h4>Peso titolarità</h4>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            type="range"
            min={0}
            max={0.3}
            step={0.01}
            value={params.titWeight}
            onChange={(e) => setParams((p) => ({ ...p, titWeight: +e.target.value }))}
            style={{ flex: 1 }}
          />
          <span className="pill">{params.titWeight.toFixed(2)}</span>
        </div>
        <div className="hint" style={{ marginTop: 4 }}>
          Più alto = i titolari sicuri (tante fonti) salgono di fascia rispetto al solo FVM.
          Default 0,15.
        </div>
      </div>

      <div className="legsec">
        <h4>Aggressività soglie R / X</h4>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={params.rxAggressiveness}
            onChange={(e) => setParams((p) => ({ ...p, rxAggressiveness: +e.target.value }))}
            style={{ flex: 1 }}
          />
          <span className="pill">{params.rxAggressiveness.toFixed(1)}×</span>
        </div>
        <div className="hint" style={{ marginTop: 4 }}>
          Più alto = più giocatori finiscono in R (riserve economiche) e X (trappole costose).
          Default 1×.
        </div>
      </div>

      <div className="legsec">
        <h4>Quote F1–F4 per ruolo</h4>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Ruolo</th>
                <th className="num">F1</th>
                <th className="num">F2</th>
                <th className="num">F3</th>
                <th className="num">F4</th>
              </tr>
            </thead>
            <tbody>
              {ROLE_ORDER.map((r) => (
                <tr key={r}>
                  <td>{RNAME[r]}</td>
                  {params.quotas[r].map((v, i) => (
                    <td className="num" key={i}>
                      <input
                        className="tin"
                        type="number"
                        min={0}
                        value={v}
                        onChange={(e) => setQuota(r, i, +e.target.value || 0)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="legsec">
        <h4>Anteprima con questi parametri</h4>
        <div className="stratpct" style={{ flexWrap: "wrap" }}>
          {TIER_LABELS.map((t) => (
            <span key={t.key} style={{ color: t.color }}>
              {t.label} {counts[t.key]}
            </span>
          ))}
        </div>
      </div>

      <label className="chk" style={{ margin: "14px 0" }}>
        <input type="checkbox" checked={resetFirst} onChange={(e) => setResetFirst(e.target.checked)} />
        Azzera le fasce attuali prima di applicare (altrimenti tocca solo i giocatori senza
        fascia)
      </label>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="pri" onClick={confirm}>
          Applica preset
        </button>
        <button className="ghost" onClick={onClose}>
          Annulla
        </button>
      </div>
    </ModalShell>
  );
}
