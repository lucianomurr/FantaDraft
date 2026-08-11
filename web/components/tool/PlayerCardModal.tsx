"use client";

import { useAsta } from "../../contexts/AstaContext";
import { NAT } from "../../lib/nations";
import { transferTypeLabel, formatTransferDate } from "../../lib/transfers";
import type { DerivedPlayer } from "../../lib/types";
import { ModalShell } from "./ModalShell";

const RMAP: Record<string, string> = { P: "rP", D: "rD", C: "rC", A: "rA" };
const CURRENT_YEAR = 2026;

export function PlayerCardModal({
  player,
  numFormSources,
  onClose,
}: {
  player: DerivedPlayer | null;
  numFormSources: number;
  onClose: () => void;
}) {
  return (
    <ModalShell open={player != null} onClose={onClose}>
      {player && <PlayerCardBody p={player} numFormSources={numFormSources} onClose={onClose} />}
    </ModalShell>
  );
}

function PlayerCardBody({
  p,
  numFormSources,
  onClose,
}: {
  p: DerivedPlayer;
  numFormSources: number;
  onClose: () => void;
}) {
  const { cfg } = useAsta();
  const eta = p.born ? CURRENT_YEAR - p.born : null;
  const nat = p.nat ? (NAT[p.nat] ?? p.nat) : "—";
  const dots = "●".repeat(p.tit) + "○".repeat(Math.max(0, numFormSources - p.tit));

  return (
    <>
      <button className="ghost sm xclose" onClick={onClose}>
        ✕
      </button>
      <div className="phead">
        <span className={`rbadge ${RMAP[p.r]}`}>{p.r}</span>
        <h3>{p.n}</h3>
        <span className="team">{p.s}</span>
        {p.pen === 1 && <span className="pen pen1">⚽ rigorista</span>}
        {p.pen === 2 && <span className="pen pen2">⚽ alt. rigori</span>}
      </div>
      <div className="pmeta">
        {nat} · {eta ? `${eta} anni (classe ${p.born})` : "età n.d."} · titolarità {dots} {p.tit}/
        {numFormSources} fonti{p.ball ? " · ⚖ in ballottaggio" : ""}
      </div>
      {cfg.mantra && (
        <div className="pmeta">
          Ruoli Mantra: {p.rm && p.rm.length > 0 ? p.rm.join(" · ") : "n.d."} · FVM Mantra{" "}
          {p.fvmM ?? "—"}
        </div>
      )}
      {p.r === "P" && p.ga != null && (
        <div className="pmeta">
          Gol subiti 2025/26: <b>{p.ga}</b>{" "}
          {p.gaIndividual
            ? "(dato individuale reale)"
            : `(stima proxy squadra${p.gaTeam != null ? `, ${p.gaTeam} in stagione` : ""}, prorata sui minuti — promossa dalla B, nessun dato individuale disponibile)`}
        </div>
      )}
      {p.inj && (
        <div className="pmeta" style={{ color: "var(--bad)" }}>
          🚑 {p.inj.d} — rientro: {p.inj.r}
        </div>
      )}
      {p.transfer?.dir === "in" && (
        <div className="pmeta" style={{ color: "var(--acc2)" }}>
          🆕 Arrivato da {p.transfer.from} il {formatTransferDate(p.transfer.date)} (
          {transferTypeLabel(p.transfer.type)})
        </div>
      )}
      {p.transfer?.dir === "out" && (
        <div className="pmeta" style={{ color: "var(--bad)" }}>
          🚪 Il listone lo ha ancora a {p.s}, ma risulta ceduto a {p.transfer.to} il{" "}
          {formatTransferDate(p.transfer.date)} ({transferTypeLabel(p.transfer.type)}) —
          verifica prima di puntarci
        </div>
      )}
      <div className="pgrid">
        <div className="pbox">
          <div className="v">{p.q}</div>
          <div className="l">Qt</div>
        </div>
        <div className="pbox">
          <div className="v">{p.f}</div>
          <div className="l">FVM</div>
        </div>
        <div className="pbox">
          <div className="v">{p.val ?? "—"}</div>
          <div className="l">Val</div>
        </div>
        <div className="pbox">
          <div className="v">{p.min}</div>
          <div className="l">Min 25/26</div>
        </div>
      </div>
      {p.xg != null && (
        <div className="pgrid" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
          <div className="pbox">
            <div className="v">{p.xg.toFixed(1)}</div>
            <div className="l">xG</div>
          </div>
          <div className="pbox">
            <div className="v">{(p.npxg ?? 0).toFixed(1)}</div>
            <div className="l">npxG</div>
          </div>
          <div className="pbox">
            <div className="v">{(p.xa ?? 0).toFixed(1)}</div>
            <div className="l">xA</div>
          </div>
          <div className="pbox">
            <div className="v">{p.sh}</div>
            <div className="l">Tiri</div>
          </div>
          <div className="pbox">
            <div className="v">{p.kp}</div>
            <div className="l">Key pass</div>
          </div>
        </div>
      )}
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Stagione</th>
              <th>Campionato</th>
              <th>Squadra</th>
              <th className="num">Pres</th>
              <th className="num">Tit</th>
              <th className="num">Min</th>
              <th className="num">Gol</th>
              <th className="num">Rig</th>
              <th className="num">Ass</th>
            </tr>
          </thead>
          <tbody>
            {(p.hist ?? []).map((h, i) => (
              <tr key={i}>
                <td>{h.sea === "2526" ? "2025/26" : "2024/25"}</td>
                <td>{h.lg}</td>
                <td>{h.tm}</td>
                <td className="num">{h.mp}</td>
                <td className="num">{h.st}</td>
                <td className="num">{h.min}</td>
                <td className="num">
                  <b>{h.gls}</b>
                </td>
                <td className="num">{h.pka ? `${h.pk}/${h.pka}` : "—"}</td>
                <td className="num">{h.ast}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="hint" style={{ marginTop: 8 }}>
        Fonti: FBref + Understat (xG/xA, stagione fonte) · righe separate per ogni tappa
        (trasferimenti a gennaio = due righe nella stessa stagione)
      </div>
    </>
  );
}
