"use client";

import { useState } from "react";
import { useAsta } from "../../contexts/AstaContext";

const STATUS_LABEL = {
  idle: "Non sincronizzato",
  connecting: "Connessione…",
  synced: "Sincronizzato",
  error: "Errore sync",
  offline: "Offline",
} as const;
const STATUS_DOT = {
  idle: "dotoff",
  connecting: "dotwait",
  synced: "doton",
  error: "doterr",
  offline: "dotoff",
} as const;

/** Chip sync (codice a 6 cifre) condiviso tra Header (desktop/sempre visibile,
 * per avviare/leggere il codice da appaiare all'altro device) e la modalità
 * "Inizia asta" mobile — stesso stato in AstaContext, un solo posto dove sta
 * la logica. */
export function SyncControl() {
  const { syncCode, syncStatus, startSync, stopSync } = useAsta();
  const [open, setOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  if (syncCode) {
    return (
      <div className="livesync">
        <button
          type="button"
          className="ghost sm syncchip"
          aria-expanded={open}
          aria-label={`Sincronizzazione: ${STATUS_LABEL[syncStatus]}, codice ${syncCode}`}
          onClick={() => setOpen((o) => !o)}
        >
          <span className={`syncdot ${STATUS_DOT[syncStatus]}`} /> {syncCode}
        </button>
        {open && (
          <div className="syncpop">
            <div className="hint">{STATUS_LABEL[syncStatus]}</div>
            <div className="hint">Inserisci {syncCode} sull&apos;altro device per collegarlo.</div>
            <button type="button" className="ghost sm" onClick={stopSync}>
              Interrompi sync
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="livesync">
      <button
        type="button"
        className="ghost sm syncchip"
        aria-expanded={open}
        aria-label="Sincronizza con un altro device"
        onClick={() => setOpen((o) => !o)}
      >
        🔗 Sync
      </button>
      {open && (
        <div className="syncpop">
          <button type="button" className="sm pri" onClick={() => startSync()}>
            Genera codice
          </button>
          <div className="hint" style={{ margin: "6px 0 4px" }}>
            oppure unisciti a un codice:
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              className="tin"
              style={{ width: 80 }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            <button
              type="button"
              className="sm"
              disabled={joinCode.length !== 6}
              onClick={() => joinCode.length === 6 && startSync(joinCode)}
            >
              Unisciti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
