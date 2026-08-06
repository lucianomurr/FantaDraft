# Design — FantaDraft2027 (landing + tool)

Mondo visivo unico: "la notte dell'asta" — il cruscotto scuro del tool esteso alla landing.
Sorgente di verità: `web/app/globals.css` (landing) e `<style>` in `asta_fantacalcio_2026_27.html` (tool).

## Token

- Ground: `--bg #0f1420` · pannelli `--panel #171d2b`, `--panel2 #1e2636` · linee `--line #2a3346`
- Testo: `--txt #e8edf6` · secondario `--muted #93a0b8` (landing) / `#8b96ab` (tool)
- Accenti: blu `--acc #4f8cff` (azione/informazione) · verde `--acc2 #38d39f` (CTA primaria, positivo)
- Ruoli: P `#f0b429` giallo · D `#4f8cff` blu · C `#38d39f` verde · A `#ff5d6c` rosso
- Stato: warn `#ffcb47` · bad `#ff5d6c`

## Tipografia

- Display (solo landing): **Barlow Condensed 600/700**, maiuscolo, tracking -0.01/-0.02em —
  registro "scoreboard sportivo italiano". H1 clamp 2.6–5.2rem, H2 1.8–2.6rem.
- Corpo (landing e tool): system stack (-apple-system…), 14–16px.
- Numeri sempre `font-variant-numeric: tabular-nums` nelle card e tabelle.

## Componenti chiave

- **dcard** (card budget): pannello 14px radius, etichetta uppercase 11px con dot ruolo,
  numero display grande, barra 6px con riempimento colore-ruolo (animata via `transform: scaleX`).
- **fonti**: elenco a righe piene (non card-grid) — nome fonte in display, descrizione muted,
  numero verde a destra; su mobile il numero sale sopra.
- **rowdemo**: tabella identica al linguaggio del tool (header uppercase 11px su panel2).
- **step**: contatore CSS in display blu, sequenza informativa (non decorativa).
- **emailbox**: pannello gradiente `#16233c → #14202f`, form input scuro + bottone blu.

## Motion

Un solo momento autorale: al load della landing, count-up dei crediti (ease-out quartico,
1.1s, rAF) + barre `scaleX` con `cubic-bezier(.19,1,.22,1)`. `prefers-reduced-motion`
salta tutto (valori finali immediati). Hover: solo brightness/background 150ms.

## Regole

- Elevazione: solo bordo 1px `--line`, niente ombre. Radius 12–16px.
- Il verde `--acc2` è riservato a CTA primaria e segnali positivi; il blu a link/azioni.
- Emoji ammesse SOLO nel tool (badge ⚽🎲🚑🎰 sono lessico funzionale del prodotto);
  la landing non usa icone decorative.
- Copy: italiano, seconda persona, concreto ("il crociato di cui non sapevi niente
  non ti costa più 40 crediti"); mai hype senza numero a supporto.
