"use client";

import { useMemo, useRef, useState } from "react";
import { useAsta, useTracking } from "../../contexts/AstaContext";
import { computeBudgetSummary } from "../../lib/budget";
import { RNAME } from "../../lib/roles";
import type { DerivedPlayer, PlayerState, Tier } from "../../lib/types";
import { SyncControl } from "./SyncControl";

const RMAP: Record<string, string> = { P: "rP", D: "rD", C: "rC", A: "rA" };
const TIERS: Tier[] = ["1", "2", "3", "4", "R", "X"];

export function LiveAuctionMode({
  players,
  onClose,
}: {
  players: DerivedPlayer[];
  onClose: () => void;
}) {
  const { cfg, st } = useAsta();
  const { getPlayerState, setTier, setTgt, setPaid, setStatus } = useTracking();
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const summary = useMemo(() => computeBudgetSummary(players, st, cfg), [players, st, cfg]);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return players.filter((p) => p.n.toLowerCase().includes(query)).slice(0, 20);
  }, [q, players]);

  const selected = selectedId != null ? (players.find((p) => p.id === selectedId) ?? null) : null;

  function pick(id: number) {
    setSelectedId(id);
    setQ("");
  }

  function back() {
    setSelectedId(null);
    requestAnimationFrame(() => searchRef.current?.focus());
  }

  return (
    <div className="livemode">
      <div className="livebar">
        <div className="livebudget">
          <b>{summary.remaining}</b> cr liberi · max <b>{summary.maxBid}</b>
        </div>
        <SyncControl />
        <button className="ghost sm livexit" onClick={onClose} aria-label="Esci dalla modalità asta">
          ✕ Esci
        </button>
      </div>

      {!selected ? (
        <div className="livesearch">
          <input
            ref={searchRef}
            autoFocus
            className="liveinput"
            type="text"
            inputMode="search"
            aria-label="Cerca il giocatore chiamato"
            placeholder="Cerca il giocatore chiamato…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q.trim() && results.length === 0 && (
            <p className="hint" style={{ padding: "0 16px" }}>
              Nessun giocatore trovato.
            </p>
          )}
          <ul className="liveresults">
            {results.map((p) => {
              const s = getPlayerState(p.id);
              return (
                <li key={p.id}>
                  <button type="button" className={`liveresrow${s.s === "out" ? " out" : ""}${s.s === "mine" ? " mine" : ""}`} onClick={() => pick(p.id)}>
                    <span className={`rbadge ${RMAP[p.r]}`}>{p.r}</span>
                    <span className="liveresname">{p.n}</span>
                    <span className="liveresteam">{p.s}</span>
                    <span className="liveresfvm">{p.f}</span>
                    {s.s === "mine" && <span className="mineflag">✔ Io</span>}
                    {s.s === "out" && <span className="hint">altri</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <PlayerFocus
          p={selected}
          s={getPlayerState(selected.id)}
          onBack={back}
          setTier={setTier}
          setTgt={setTgt}
          setPaid={setPaid}
          setStatus={setStatus}
        />
      )}
    </div>
  );
}

function PlayerFocus({
  p,
  s,
  onBack,
  setTier,
  setTgt,
  setPaid,
  setStatus,
}: {
  p: DerivedPlayer;
  s: PlayerState;
  onBack: () => void;
  setTier: (id: number, tier: Tier | null) => void;
  setTgt: (id: number, tgt: number | null) => void;
  setPaid: (id: number, paid: number | null) => void;
  setStatus: (id: number, status: "free" | "mine" | "out") => void;
}) {
  return (
    <div className="livecard">
      <button type="button" className="ghost sm liveback" onClick={onBack}>
        ← Altro giocatore
      </button>

      <div className="livehead">
        <span className={`rbadge ${RMAP[p.r]}`}>{p.r}</span>
        <div>
          <div className="livename">{p.n}</div>
          <div className="team">
            {p.s} · {RNAME[p.r]}
          </div>
        </div>
      </div>

      <div className="livestats">
        <div className="livestatbox">
          <div className="v">{p.q}</div>
          <div className="l">Qt</div>
        </div>
        <div className="livestatbox">
          <div className="v">{p.f}</div>
          <div className="l">FVM</div>
        </div>
        <div className="livestatbox">
          <div className="v">{p.val ?? "—"}</div>
          <div className="l">Val</div>
        </div>
        <div className="livestatbox">
          <div className="v">
            {p.xg != null ? p.xg.toFixed(1) : "—"}/{p.xa != null ? p.xa.toFixed(1) : "—"}
          </div>
          <div className="l">xG/xA</div>
        </div>
      </div>

      <div className="livesection">
        <div className="livelabel">Fascia</div>
        <div className="tiergroup livetiers">
          {TIERS.map((t) => (
            <button
              key={t}
              className={`tbtn${String(s.t) === t ? " on" + t : ""}`}
              onClick={() => setTier(p.id, t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="livesection">
        <div className="livelabel">Prezzo target</div>
        <input
          className="tin livetgt"
          type="number"
          min={0}
          value={s.tgt ?? ""}
          placeholder="—"
          onChange={(e) => setTgt(p.id, e.target.value === "" ? null : +e.target.value)}
        />
      </div>

      <div className="liveactions">
        {s.s === "mine" ? (
          <>
            <div className="liveminebox">
              <span className="mineflag">✔ Preso da te</span>
              <input
                className="paidin"
                type="number"
                min={0}
                autoFocus
                value={s.p ?? ""}
                placeholder="prezzo pagato"
                onChange={(e) => setPaid(p.id, e.target.value === "" ? null : +e.target.value)}
              />
            </div>
            <button className="livebtn" onClick={() => setStatus(p.id, "free")}>
              Annulla
            </button>
          </>
        ) : s.s === "out" ? (
          <>
            <div className="hint" style={{ fontSize: 15 }}>
              Preso da altri
            </div>
            <button className="livebtn" onClick={() => setStatus(p.id, "free")}>
              ↺ Annulla
            </button>
          </>
        ) : (
          <>
            <button
              className="livebtn liveio"
              onClick={() => setStatus(p.id, "mine")}
            >
              ✔ Io
            </button>
            <button className="livebtn livealtri" onClick={() => setStatus(p.id, "out")}>
              Altri
            </button>
          </>
        )}
      </div>
    </div>
  );
}
