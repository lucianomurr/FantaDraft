"use client";

import { useAsta } from "../../contexts/AstaContext";
import { titBallDots } from "../../lib/formations";
import { NAT } from "../../lib/nations";
import { findSimilarPlayers } from "../../lib/similar";
import { transferTypeLabel, formatTransferDate } from "../../lib/transfers";
import type { DerivedPlayer } from "../../lib/types";
import { ModalShell } from "./ModalShell";

const RMAP: Record<string, string> = { P: "rP", D: "rD", C: "rC", A: "rA" };
const CURRENT_YEAR = 2026;
const SEASON_LABEL: Record<string, string> = { "2627": "2026/27", "2526": "2025/26", "2425": "2024/25" };

export function PlayerCardModal({
  player,
  numFormSources,
  allPlayers,
  onClose,
  onOpenCard,
}: {
  player: DerivedPlayer | null;
  numFormSources: number;
  allPlayers: DerivedPlayer[];
  onClose: () => void;
  onOpenCard: (id: number) => void;
}) {
  return (
    <ModalShell open={player != null} onClose={onClose} title={player ? `Scheda ${player.n}` : "Scheda giocatore"}>
      {player && (
        <PlayerCardBody
          p={player}
          numFormSources={numFormSources}
          allPlayers={allPlayers}
          onClose={onClose}
          onOpenCard={onOpenCard}
        />
      )}
    </ModalShell>
  );
}

function PlayerCardBody({
  p,
  numFormSources,
  allPlayers,
  onClose,
  onOpenCard,
}: {
  p: DerivedPlayer;
  numFormSources: number;
  allPlayers: DerivedPlayer[];
  onClose: () => void;
  onOpenCard: (id: number) => void;
}) {
  const { cfg, st, toggleFav } = useAsta();
  const eta = p.born ? CURRENT_YEAR - p.born : null;
  const nat = p.nat ? (NAT[p.nat] ?? p.nat) : "—";
  const { tit, ballOnly, empty, titCls } = titBallDots(p, numFormSources);
  const isOut = st[p.id]?.s === "out";
  const isFav = !!st[p.id]?.fav;
  const similar = isOut ? findSimilarPlayers(p, allPlayers, st) : [];

  return (
    <>
      <button className="ghost sm xclose" onClick={onClose} aria-label="Chiudi">
        ✕
      </button>
      <div className="phead">
        <button
          type="button"
          className={`favstar${isFav ? " on" : ""}`}
          style={{ fontSize: 20 }}
          title={isFav ? "Togli dai preferiti" : "Aggiungi ai preferiti"}
          aria-pressed={isFav}
          onClick={() => toggleFav(p.id)}
        >
          {isFav ? "★" : "☆"}
        </button>
        <span className={`rbadge ${RMAP[p.r]}`}>{p.r}</span>
        <h2>{p.n}</h2>
        <span className="team">{p.s}</span>
        {p.pen === 1 && <span className="pen pen1">⚽ rigorista</span>}
        {p.pen === 2 && <span className="pen pen2">⚽ alt. rigori</span>}
      </div>
      <div className="pmeta">
        {nat} · {eta ? `${eta} anni (classe ${p.born})` : "età n.d."} · titolarità{" "}
        <span className={titCls}>{"●".repeat(tit)}</span>
        {ballOnly > 0 && <span className="titball">{"◐".repeat(ballOnly)}</span>}
        <span className="tit0">{"○".repeat(empty)}</span> {p.tit}/{numFormSources} fonti
        {ballOnly > 0 && ` · in ballottaggio in altre ${ballOnly}`}
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
      {isOut && (
        <div className="pmeta" style={{ color: "var(--acc2)" }}>
          🔄 Preso da altri — alternative simili (ruolo {p.r}, FVM e{" "}
          {p.r === "P" ? "Val" : "xG+xA"} vicini, ancora libere):
          {similar.length === 0 ? (
            <div className="hint">Nessuna alternativa libera trovata per questo ruolo.</div>
          ) : (
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {similar.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className="pname"
                    style={{ fontSize: "inherit" }}
                    onClick={() => onOpenCard(s.id)}
                  >
                    {s.n}
                  </button>{" "}
                  ({s.s}) · FVM {s.f}
                  {s.r === "P" ? ` · Val ${s.val ?? "—"}` : ` · xG ${(s.xg ?? 0).toFixed(1)} xA ${(s.xa ?? 0).toFixed(1)}`}
                </li>
              ))}
            </ul>
          )}
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
      {p.voti && p.voti.length > 0 && (
        <div className="pmeta" style={{ marginBottom: 10 }}>
          <b style={{ color: "var(--txt)" }}>Voti 2026/27</b>{" "}
          {p.voti.map((v) => (
            <span key={v.g} style={{ marginRight: 10 }}>
              G{v.g}: {v.v.toFixed(1).replace(".", ",")}
              {v.fv !== v.v ? ` (FV ${v.fv.toFixed(1).replace(".", ",")})` : ""}
            </span>
          ))}
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
                <td>{SEASON_LABEL[h.sea] ?? h.sea}</td>
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
