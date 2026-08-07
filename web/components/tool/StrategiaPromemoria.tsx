"use client";

export function StrategiaPromemoria() {
  return (
    <details className="strat">
      <summary>📋 Promemoria strategia d&apos;asta (clicca per aprire)</summary>
      <div className="stbody">
        <div className="stgrid">
          <div className="stbox">
            <h4 style={{ color: "var(--p)" }}>🧤 Porta · ~35 cr</h4>
            Blocco della miglior difesa (clean sheet frequenti) <b>oppure</b> coppia di fascia
            media che si alterna in casa. Un portiere che subisce gol rovina il modificatore.
          </div>
          <div className="stbox">
            <h4 style={{ color: "var(--d)" }}>🛡️ Difesa · ~75 cr</h4>
            2 pilastri da alta media voto (25 cr l&apos;uno) + 2 titolari costanti da 6 facile +
            4 low-cost da 1 cr (neopromosse). Servono 4 titolari per il modificatore (4-3-3 /
            4-4-2).
          </div>
          <div className="stbox">
            <h4 style={{ color: "var(--c)" }}>🏃 Centrocampo · ~105 cr</h4>
            1 leader/rigorista di una big (40-50) + 2 mezzali/esterni da bonus + regolaristi da
            1-2 cr per la panchina. Punta a chi porta bonus pesanti.
          </div>
          <div className="stbox">
            <h4 style={{ color: "var(--a)" }}>⚽ Attacco · ~285 cr</h4>
            1 super top da 20+ gol e rigori (170-190) + 1 spalla rigorista (60-70) + riempitivi
            per ruotare col calendario. È il cuore della spesa.
          </div>
        </div>
        <b>Trucchi:</b> chiama subito top che non ti interessano per far spendere gli altri ·
        evita i duelli a due (lascia salire il prezzo all&apos;avversario) · conserva 5-10
        crediti in più per rubare le occasioni finali a 1-2 cr · non inseguire i giocatori a
        tutti i costi · niente acquisti &quot;del cuore&quot;.
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
          <b>Modificatori — cambiano i valori:</b> <b>Difesa</b> premia chi schiera 4 difensori
          (bonus su media voto dei 3 migliori + portiere) → alza il valore di portieri top e
          terzini di spinta · <b>Portiere/Imbattibilità</b> bonus per rete inviolata → rende
          fondamentali i portieri delle big · <b>Centrocampo/Attacco</b> bonus sulla differenza
          voti di reparto → cerca giocatori che raramente prendono insufficienze ·{" "}
          <b>Capitano</b> raddoppia i suoi bonus → vitale avere almeno un top assoluto.
          <div className="hint" style={{ marginTop: 8 }}>
            Strategie di ripartizione budget (vedi onboarding), concetto Slot e modificatori
            adattati dalla guida di Giosuè Fichera, pubblicata originariamente sul forum Gruppo
            Esperti.
          </div>
        </div>
      </div>
    </details>
  );
}
