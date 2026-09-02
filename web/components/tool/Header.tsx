"use client";

import { useMemo, useRef } from "react";
import { useAsta } from "../../contexts/AstaContext";
import { RTARGET, ROLES } from "../../lib/roles";
import type { Player } from "../../lib/types";
import { SyncControl } from "./SyncControl";

export function Header({
  players,
  onShowLegend,
  onShowPreset,
  onShowLineup,
  onStartLive,
  updatedAt,
}: {
  players: Player[];
  onShowLegend: () => void;
  onShowPreset: () => void;
  onShowLineup: () => void;
  onStartLive: () => void;
  updatedAt: string;
}) {
  const { cfg, st, resetLive, resetAll, importState, toast } = useAsta();
  const fileRef = useRef<HTMLInputElement>(null);

  // "Rosa completa" = ogni ruolo ha raggiunto il suo target (3P/8D/8C/6A) —
  // solo a quel punto la formazione consigliata ha senso (prima mancano
  // ancora candidati per riempire un modulo valido in qualche ruolo).
  const rosterComplete = useMemo(() => {
    const mineByRole: Record<string, number> = { P: 0, D: 0, C: 0, A: 0 };
    for (const p of players) {
      if (st[p.id]?.s === "mine") mineByRole[p.r]++;
    }
    return ROLES.every((r) => mineByRole[r] >= RTARGET[r]);
  }, [players, st]);

  function exportData() {
    const blob = new Blob([JSON.stringify({ cfg, st, ts: new Date().toISOString() }, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "asta_fantacalcio_backup.json";
    a.click();
    toast("Backup scaricato");
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const o = JSON.parse(String(rd.result));
        importState(o.cfg ?? {}, o.st ?? {});
      } catch {
        toast("File non valido");
      }
    };
    rd.readAsText(f);
    e.target.value = "";
  }

  return (
    <header className="top">
      <div className="brand">
        <div className="logo">⚽</div>
        <div>
          <h1>FantaDraft2027</h1>
          <div className="sub">
            Tool strategico · Classic · 10 squadre · budget 500 crediti · dati aggiornati al{" "}
            {updatedAt}
          </div>
        </div>
      </div>
      <div className="tools">
        <button className="pri sm live-enter" onClick={onStartLive}>
          🎙 Inizia asta
        </button>
        <SyncControl />
        <button className="ghost sm" onClick={exportData}>
          ⬇ Backup
        </button>
        <button className="ghost sm" onClick={() => fileRef.current?.click()}>
          ⬆ Ripristina
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          onChange={onFileChange}
        />
        <button className="ghost sm" onClick={onShowPreset}>
          ✨ Preset fasce
        </button>
        <button
          className="ghost sm"
          onClick={onShowLineup}
          disabled={!rosterComplete}
          title={rosterComplete ? undefined : "Disponibile a rosa completa (3P/8D/8C/6A)"}
        >
          📋 Formazione
        </button>
        <button className="ghost sm" onClick={onShowLegend}>
          ❓ Legenda
        </button>
        <button
          className="ghost sm"
          onClick={() => {
            if (
              confirm(
                "Azzerare SOLO il tracking asta (Io/Altri e prezzi pagati)? Le fasce e i target restano.",
              )
            )
              resetLive();
          }}
        >
          ↺ Reset asta
        </button>
        <button
          className="ghost sm"
          onClick={() => {
            if (
              confirm(
                "Cancellare TUTTO (fasce, target, tracking, budget e impostazioni Classic/Mantra)? Riparte l'onboarding. Operazione irreversibile.",
              )
            )
              resetAll();
          }}
        >
          🗑 Reset totale
        </button>
      </div>
    </header>
  );
}
