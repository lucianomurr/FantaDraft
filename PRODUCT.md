# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) in `web/`, deploy su Vercel free tier (scelta utente).
Il tool vero e proprio resta un single-file HTML statico (`asta_fantacalcio_2026_27.html`),
servito dalla app come pagina statica. Email: tratto.email via API route server-side
(chiave in env `TRATTO_KEY`). Analytics: Google Analytics (`NEXT_PUBLIC_GA_ID`).

## Users

Fantallenatori italiani (lega Classic) che preparano l'asta estiva: mettono i giocatori
in fasce, fissano prezzi target e durante l'asta live segnano acquisti e budget residuo.
Utente tipo: Luciano e chiunque arrivi dal repo pubblico/post. Uso da desktop/laptop
durante l'asta, preparazione anche da mobile.

## Product Purpose

Tool gratuito e open source per preparare e condurre l'asta del fantacalcio Serie A
2026/27. Successo = arrivare all'asta con fasce/target basati su dati reali e uscirne
con la rosa voluta senza sforare il budget.

## Positioning

L'unico tool d'asta single-file (apri l'HTML e funziona, zero installazioni, dati tuoi
in localStorage) che incrocia: quotazioni ufficiali + FVM, statistiche reali
FBref + Understat (xG/xA inclusi), probabili formazioni aggregate da 5 fonti,
gerarchie rigoristi (Gazzetta), infortunati con prognosi, e un indice di convenienza
(Val) trasparente. Completamente free, nessun account.

## Operating Context

Preparazione nelle 1-2 settimane pre-asta (asta tipica: inizio settembre); refresh dati
1-2 giorni prima via script Python nel repo. Durante l'asta: tool aperto nel browser,
tracking acquisti in tempo reale. Stato salvato in localStorage + backup/ripristino JSON.

## Capabilities and Constraints

- Tool: dashboard budget per reparto, fasce 1/2/3/4/R/X con preset data-driven,
  colonne statistiche ordinabili (G, Rig, A, xG, xA, Min, Val, Tit), scheda giocatore,
  pannello probabili formazioni 5 fonti, badge rigoristi/infortunati/scommesse.
- Dati incorporati nell'HTML (const PLAYERS/FORMS): aggiornarli = rigenerare il file.
- xG/xA non disponibili per la Serie B (Understat non la copre).
- Landing: raccolta email SOLO per avvisare di nuove versioni del tool; niente spam,
  niente account, tutto gratuito. GDPR: tratto.email è EU-hosted.
- Indicizzabile (SEO on), lingua italiana.

## Brand Commitments

Nome pubblico: **FantaDraft2027** (deciso 06/08/2026). Tono: da fantallenatore per
fantallenatori, concreto, zero hype ingiustificato. Gratuito e open source
(github.com/lucianomurr/asta-fantacalcio) come parte dell'identità.

## Evidence on Hand

- Il tool funzionante: `asta_fantacalcio_2026_27.html` (493 giocatori, 445 con stat).
- Numeri veri citabili in landing: 493 giocatori, 5 fonti formazioni, 2 stagioni di
  statistiche, xG/xA Understat, 20 infortunati tracciati, 20 gerarchie rigoristi.
- NON esistono: testimonial, utenti attivi, casi studio. Non inventarli.

## Product Principles

- I dati prima delle opinioni: ogni indicatore mostrato deve essere spiegabile (formula visibile).
- Zero attrito: niente registrazione, niente installazione, il tool si apre e funziona.
- Onestà sui limiti (es. Serie B senza xG, campioni piccoli marcati 🎰).
- Tutto free e open source; l'email è un favore chiesto, non un pedaggio.
