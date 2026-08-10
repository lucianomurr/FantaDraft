"use client";

import { useRef } from "react";
import { useAsta } from "../../contexts/AstaContext";

export function Header({
  onShowLegend,
  onShowPreset,
}: {
  onShowLegend: () => void;
  onShowPreset: () => void;
}) {
  const { cfg, st, resetLive, resetAll, importState, toast } = useAsta();
  const fileRef = useRef<HTMLInputElement>(null);

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
          <div className="sub">Tool strategico · Classic · 10 squadre · budget 500 crediti</div>
        </div>
      </div>
      <div className="tools">
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
