"use client";

import { ModalShell } from "./ModalShell";

export function LegendModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <ModalShell open={open} onClose={onClose}>
      <button className="ghost sm xclose" onClick={onClose}>
        ✕
      </button>
      <div className="phead">
        <h3>❓ Legenda</h3>
      </div>

      <div className="legsec">
        <h4>Fasce</h4>
        <div className="legrow">
          <span className="sw" style={{ background: "var(--f1)" }} />
          F1 — Obiettivo top
        </div>
        <div className="legrow">
          <span className="sw" style={{ background: "var(--f2)" }} />
          F2
        </div>
        <div className="legrow">
          <span className="sw" style={{ background: "var(--f3)" }} />
          F3
        </div>
        <div className="legrow">
          <span className="sw" style={{ background: "var(--f4)" }} />
          F4 — Alternativa
        </div>
        <div className="legrow">
          <span className="sw" style={{ background: "var(--fr)" }} />
          R — Riserva 1cr
        </div>
        <div className="legrow">
          <span className="sw" style={{ background: "var(--fx)" }} />
          X — Evita
        </div>
      </div>

      <div className="legsec">
        <h4>Rigoristi</h4>
        <div className="legrow">
          <span className="pen pen1" style={{ margin: 0 }}>
            ⚽
          </span>{" "}
          Designato
        </div>
        <div className="legrow">
          <span className="pen pen2" style={{ margin: 0 }}>
            ⚽
          </span>{" "}
          Alternativo
        </div>
      </div>

      <div className="legsec">
        <h4>Badge sul nome</h4>
        <div className="legrow">
          <span className="bet" style={{ margin: 0 }}>
            🎲
          </span>{" "}
          Senza dati (esordiente/scommessa)
        </div>
        <div className="legrow">
          <span className="bet inj" style={{ margin: 0 }}>
            🚑
          </span>{" "}
          Infortunato (tooltip: prognosi e rientro)
        </div>
        <div className="legrow">
          <span className="bet transfer-in" style={{ margin: 0 }}>
            🆕
          </span>{" "}
          Nuovo arrivo nella squadra (tooltip: da dove e quando)
        </div>
        <div className="legrow">
          <span className="bet transfer-out" style={{ margin: 0 }}>
            🚪
          </span>{" "}
          Ceduto/svincolato ma ancora nel listone alla vecchia squadra — verifica prima di puntarci
        </div>
        <div className="legrow">🎰 accanto a Val — indice alto su pochi minuti (forte scommessa)</div>
        <div className="legrow">🔥 accanto a xG — sottoperformante (gol &lt; xG-2): sfortuna passata, possibile rimonta</div>
        <div className="legrow">⚠️ accanto a xG — sovraperformante (gol &gt; xG+2): occhio a pagarlo come una certezza</div>
      </div>

      <div className="legsec">
        <h4>Colonna Min — indicatore titolarità</h4>
        <div className="legrow">
          <span className="mindot min-hi" />
          ≥1800 minuti
        </div>
        <div className="legrow">
          <span className="mindot min-mid" />
          900–1799
        </div>
        <div className="legrow">
          <span className="mindot min-lo" />
          &lt;900
        </div>
      </div>

      <div className="legsec">
        <h4>Colonne</h4>
        <div className="legrow">Qt — quotazione base · FVM — valore di mercato (stima prezzo)</div>
        <div className="legrow">Tgt — tuo prezzo max · Io/Altri — tracking asta</div>
        <div className="legrow">G/Rig/A/Min — stagione più recente (25/26, altrimenti 24/25 — Big 5 europei + Serie B)</div>
        <div className="legrow">xG/xA — da Understat (non copre la Serie B)</div>
        <div className="legrow">Val — (3×gol + assist) / FVM × 100, più alto = più bonus per credito</div>
        <div className="legrow">
          Val portieri — (100 − gol subiti) / FVM × 100. Gol subiti 2025/26 individuali reali
          (copiati da FBref, scraping automatico bloccato da CAPTCHA); per le squadre promosse
          dalla Serie B, senza dato individuale, proxy di squadra prorata sui minuti — indicato
          nella scheda giocatore. Solo con ≥900 min e FVM ≥3, sotto soglia mostra &quot;—&quot;.
          Scala diversa dal Val degli altri ruoli, non confrontabile direttamente.
        </div>
        <div className="legrow">Tit — in quante formazioni tipo su 5 il giocatore parte titolare · ⚖ = in ballottaggio</div>
      </div>
    </ModalShell>
  );
}
