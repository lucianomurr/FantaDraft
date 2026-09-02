"use client";

import { useEffect, useMemo, useRef } from "react";
import { useAsta } from "../../contexts/AstaContext";
import { computeBudgetSummary, allocSum } from "../../lib/budget";
import { RNAME, RVAR } from "../../lib/roles";
import type { Player } from "../../lib/types";

const ROLE_COLOR_CLASS: Record<string, string> = { P: "p", D: "d", C: "c", A: "a" };

export function BudgetPanel({ players }: { players: Player[] }) {
  const { cfg, st, setCfg } = useAsta();
  const summary = useMemo(() => computeBudgetSummary(players, st, cfg), [players, st, cfg]);
  const sum = allocSum(cfg);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  // Aperto di default su desktop, chiuso su mobile (una volta impostato il
  // budget non serve più tenerlo davanti). Settato via ref, una volta sola al
  // mount: se lo pilotassimo con un prop `open` legato allo state, ogni
  // re-render (ce ne sono tanti: un acquisto = un re-render) richiuderebbe il
  // pannello anche se l'utente l'aveva appena riaperto a mano.
  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = window.innerWidth >= 700;
  }, []);

  return (
    <>
      <details className="strat editbudget-details" ref={detailsRef}>
        <summary>
          Budget &amp; allocazione <span className="hint">· {cfg.budget}cr</span>
        </summary>
        <div className="editbudget">
          <label className="chk">
            <input
              type="checkbox"
              checked={cfg.mantra}
              onChange={(e) => setCfg({ mantra: e.target.checked })}
            />
            Mantra
          </label>
          <label className="chk">
            <input
              type="checkbox"
              checked={cfg.modDifesa}
              onChange={(e) => setCfg({ modDifesa: e.target.checked })}
            />
            Mod. difesa
          </label>
          <span className="ebfield">
            <label>Totale</label>
            <input
              type="number"
              min={1}
              value={cfg.budget}
              onChange={(e) => setCfg({ budget: +e.target.value || 500 })}
            />
          </span>
          <span className="ebfield">
            <label>Porta</label>
            <input type="number" min={0} value={cfg.P} onChange={(e) => setCfg({ P: +e.target.value || 0 })} />
          </span>
          <span className="ebfield">
            <label>Difesa</label>
            <input type="number" min={0} value={cfg.D} onChange={(e) => setCfg({ D: +e.target.value || 0 })} />
          </span>
          <span className="ebfield">
            <label>Centr.</label>
            <input type="number" min={0} value={cfg.C} onChange={(e) => setCfg({ C: +e.target.value || 0 })} />
          </span>
          <span className="ebfield">
            <label>Att.</label>
            <input type="number" min={0} value={cfg.A} onChange={(e) => setCfg({ A: +e.target.value || 0 })} />
          </span>
          <span
            className="hint"
            style={{ color: sum > cfg.budget ? "var(--bad)" : sum < cfg.budget ? "var(--warn)" : "var(--good)" }}
          >
            Allocati {sum} / {cfg.budget} cr
          </span>
        </div>
        <div className="editbudget" style={{ marginTop: 4 }}>
          <span className="hint" style={{ width: "100%" }}>
            Slot di rosa per ruolo (quanti ne compri in tutto — default 3/8/8/6, cambia se la tua
            lega usa regole diverse):
          </span>
          <span className="ebfield">
            <label>Porta</label>
            <input
              type="number"
              min={1}
              value={cfg.slots.P}
              onChange={(e) => setCfg({ slots: { ...cfg.slots, P: +e.target.value || 1 } })}
            />
          </span>
          <span className="ebfield">
            <label>Difesa</label>
            <input
              type="number"
              min={1}
              value={cfg.slots.D}
              onChange={(e) => setCfg({ slots: { ...cfg.slots, D: +e.target.value || 1 } })}
            />
          </span>
          <span className="ebfield">
            <label>Centr.</label>
            <input
              type="number"
              min={1}
              value={cfg.slots.C}
              onChange={(e) => setCfg({ slots: { ...cfg.slots, C: +e.target.value || 1 } })}
            />
          </span>
          <span className="ebfield">
            <label>Att.</label>
            <input
              type="number"
              min={1}
              value={cfg.slots.A}
              onChange={(e) => setCfg({ slots: { ...cfg.slots, A: +e.target.value || 1 } })}
            />
          </span>
          <span className="hint">Totale rosa: {cfg.slots.P + cfg.slots.D + cfg.slots.C + cfg.slots.A}</span>
        </div>
      </details>

      <div className="grid-cards">
        {summary.roles.map((rb) => (
          <div className="card" key={rb.role}>
            <div className="rlbl">
              <span className="dot" style={{ background: `var(${RVAR[rb.role]})` }} />
              {RNAME[rb.role]}
            </div>
            <div className="big">
              {rb.spent}
              <span style={{ fontSize: 13, color: "var(--muted)" }}> / {rb.alloc}</span>
            </div>
            <div className="line2">
              Residuo{" "}
              <b className={rb.over ? "overbudget" : ""} style={{ color: rb.over ? "var(--bad)" : "var(--good)" }}>
                {rb.resid}
              </b>{" "}
              · presi {rb.mine}/{rb.slotsTarget}
            </div>
            <div className="bar">
              <span
                style={{
                  width: `${rb.pct}%`,
                  background: rb.over ? "var(--bad)" : `var(--${ROLE_COLOR_CLASS[rb.role]})`,
                }}
              />
            </div>
            <div className="slots">
              {Array.from({ length: rb.slotsTarget }).map((_, i) => (
                <span key={i} className={`slot${i < rb.mine ? " f" : ""}`} />
              ))}
            </div>
          </div>
        ))}
        <div className="card total">
          <div className="rlbl">
            <span className="dot" style={{ background: "linear-gradient(90deg,var(--acc),var(--acc2))" }} />
            Totale
          </div>
          <div className={`big${summary.overBudget ? " overbudget" : ""}`}>
            {summary.remaining}
            <span style={{ fontSize: 13, color: "var(--muted)" }}> liberi</span>
          </div>
          <div className="line2">
            Spesi {summary.totalSpent}/{cfg.budget} · rosa {summary.totalMine}/{summary.totalSlots}
          </div>
          <div className="line2" style={{ marginTop: 6 }}>
            Max su 1 giocatore: <b style={{ color: "var(--warn)" }}>{Math.max(0, summary.maxBid)}</b>
          </div>
          <div className="hint" style={{ marginTop: 3 }}>
            (tenendo 1 cr per {Math.max(0, summary.emptySlots - 1)} slot vuoti)
          </div>
        </div>
      </div>
    </>
  );
}
