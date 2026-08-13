"use client";

import { memo } from "react";
import { useTracking } from "../../contexts/AstaContext";
import { titBallDots } from "../../lib/formations";
import { xgFlag, isSmallSampleBet } from "../../lib/scoring";
import { transferTooltip } from "../../lib/transfers";
import type { DerivedPlayer, Tier } from "../../lib/types";

const RMAP: Record<string, string> = { P: "rP", D: "rD", C: "rC", A: "rA" };
const TIERS: Tier[] = ["1", "2", "3", "4", "R", "X"];

function StatCells({ p }: { p: DerivedPlayer }) {
  if (!p.stat) {
    return (
      <>
        {Array.from({ length: 7 }).map((_, i) => (
          <td className="num nostat" key={i}>
            —
          </td>
        ))}
      </>
    );
  }
  const rig = (p.pkatt ?? 0) > 0 ? `${p.pk}/${p.pkatt}` : "";
  const min = p.min ?? 0;
  const mcls = min >= 1800 ? "min-hi" : min >= 900 ? "min-mid" : "min-lo";
  const seasonLabel = p.sea === "2526" ? "2025/26" : "2024/25";
  const mtip = `${p.starts} da titolare su ${p.mp} presenze · stagione ${seasonLabel} · ${(p.src ?? "").replace(/^[A-Z]+-/, "")}`;
  const flag = xgFlag(p);
  const xgTitle =
    p.xg != null ? `npxG ${(p.npxg ?? 0).toFixed(1)} (senza rigori) · ${p.sh ?? 0} tiri` : undefined;

  return (
    <>
      <td className="num statcell">{p.gls}</td>
      <td className="num statcell">{rig}</td>
      <td className="num statcell">{p.ast}</td>
      {p.xg != null ? (
        <td className="num statcell" title={xgTitle}>
          {p.xg.toFixed(1)}
          {flag === "under" && (
            <span
              className="xgflag"
              title={`Sottoperformante: ${p.gls} gol su ${p.xg.toFixed(1)} xG — sfortuna passata, possibile rimonta a prezzo scontato`}
            >
              🔥
            </span>
          )}
          {flag === "over" && (
            <span
              className="xgflag"
              title={`Sovraperformante: ${p.gls} gol su ${p.xg.toFixed(1)} xG — occhio a pagarlo come fosse una certezza, rendimento a rischio`}
            >
              ⚠️
            </span>
          )}
        </td>
      ) : (
        <td className="num nostat">—</td>
      )}
      {p.xa != null ? (
        <td className="num statcell" title={`${p.kp ?? 0} key passes`}>
          {p.xa.toFixed(1)}
        </td>
      ) : (
        <td className="num nostat">—</td>
      )}
      <td className="num statcell" title={mtip}>
        <span className={`mindot ${mcls}`} />
        {min}
      </td>
      <td className={`num statcell${p.val != null && p.val >= 15 ? " valhi" : ""}`}>
        {p.val ?? "—"}
        {isSmallSampleBet(p) && (
          <span
            className="ballot"
            title={`Val altissimo ma campione piccolo (${min} min): forte scommessa`}
            style={{ cursor: "help" }}
          >
            {" "}
            🎰
          </span>
        )}
      </td>
    </>
  );
}

export const PlayerRow = memo(function PlayerRow({
  p,
  numFormSources,
  onOpenCard,
  mantra,
}: {
  p: DerivedPlayer;
  numFormSources: number;
  onOpenCard: (id: number) => void;
  mantra: boolean;
}) {
  const { getPlayerState, setTier, setTgt, setPaid, setStatus } = useTracking();
  const s = getPlayerState(p.id);
  const rowCls = s.s === "mine" ? "mine" : s.s === "out" ? "out" : "";
  const { tit, ballOnly, empty, titCls, title: titTitle } = titBallDots(p, numFormSources);

  return (
    <tr className={rowCls}>
      <td className="name">
        <button type="button" className="pname" title="Apri scheda giocatore" onClick={() => onOpenCard(p.id)}>
          {p.n}
        </button>
        {p.pen === 1 && (
          <span className="pen pen1" title="Rigorista designato">
            ⚽
          </span>
        )}
        {p.pen === 2 && (
          <span className="pen pen2" title="Rigorista alternativo / seconda scelta">
            ⚽
          </span>
        )}
        {!p.stat && (
          <span className="bet" title="Nessun dato FBref (Big 5, ultime 2 stagioni) — esordiente/scommessa">
            🎲
          </span>
        )}
        {p.inj && (
          <span className="bet inj" title={`${p.inj.d} — rientro: ${p.inj.r}`}>
            🚑
          </span>
        )}
        {p.transfer?.dir === "in" && (
          <span className="bet transfer-in" title={transferTooltip(p.transfer, p.s)}>
            🆕
          </span>
        )}
        {p.transfer?.dir === "out" && (
          <span className="bet transfer-out" title={transferTooltip(p.transfer, p.s)}>
            🚪
          </span>
        )}
      </td>
      <td className="team">{p.s}</td>
      <td style={{ textAlign: "center" }}>
        <span className={`rbadge ${RMAP[p.r]}`}>{p.r}</span>
      </td>
      {mantra && (
        <td className="team" style={{ fontSize: 12 }}>
          {p.rm && p.rm.length > 0 ? p.rm.join(" · ") : "—"}
        </td>
      )}
      <td className="num">{p.q}</td>
      <td className="num">{p.f}</td>
      <StatCells p={p} />
      <td style={{ textAlign: "center" }} title={titTitle}>
        <span className={titCls}>{"●".repeat(tit)}</span>
        {ballOnly > 0 && <span className="titball">{"◐".repeat(ballOnly)}</span>}
        <span className="tit0">{"○".repeat(empty)}</span>
      </td>
      <td style={{ textAlign: "center" }}>
        <div className="tiergroup" style={{ justifyContent: "center" }}>
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
      </td>
      <td className="num">
        <input
          className="tin"
          type="number"
          min={0}
          value={s.tgt ?? ""}
          placeholder="—"
          onChange={(e) => setTgt(p.id, e.target.value === "" ? null : +e.target.value)}
        />
      </td>
      <td>
        <div className="actgroup">
          {s.s === "mine" ? (
            <>
              <span className="mineflag">✔ Io</span>
              <input
                className="paidin"
                type="number"
                min={0}
                value={s.p ?? ""}
                placeholder="cr"
                onChange={(e) => setPaid(p.id, e.target.value === "" ? null : +e.target.value)}
              />
              <button className="sm" onClick={() => setStatus(p.id, "free")}>
                ✕
              </button>
            </>
          ) : s.s === "out" ? (
            <>
              <span className="hint">preso da altri</span>
              <button className="sm" onClick={() => setStatus(p.id, "free")}>
                ↺
              </button>
            </>
          ) : (
            <>
              <button
                className="sm"
                style={{ borderColor: "var(--good)", color: "var(--good)" }}
                onClick={() => setStatus(p.id, "mine")}
              >
                Io
              </button>
              <button className="sm" onClick={() => setStatus(p.id, "out")}>
                Altri
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
});
