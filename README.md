# FantaDraft2027 — tool gratuito per l'asta del fantacalcio Serie A 2026/27

Un solo file HTML, zero dipendenze, zero account: lo apri nel browser e prepari
l'asta coi numeri. Completamente **gratuito e open source**.

**➡️ Tool: apri `asta_fantacalcio_2026_27.html` nel browser** (o dalla landing su `/tool`).

## Cosa fa

- **493 giocatori** con quotazioni ufficiali 2026/27 (Qt + FVM)
- **Statistiche reali** di 2 stagioni da FBref (gol, rigori, assist, minuti, titolarità) —
  Big 5 europei + Serie B, quindi anche neopromossi e nuovi arrivi
- **xG e xA da Understat** per distinguere chi è forte da chi è stato fortunato
- **Probabili formazioni aggregate da 5 fonti** (SOS Fanta, FantaMaster, Eurosport, Goal,
  Gazzetta): colonna Tit = in quanti XI su 5 parte titolare
- **Rigoristi** (gerarchie Gazzetta: designato + alternative) e **infortunati** (prognosi + rientro)
- **Val**: indice di convenienza trasparente = (3×gol + assist) / FVM × 100
- **Preset fasce** data-driven + fasce personali 1/2/3/4/R/X con prezzi target
- **Asta live**: tracking acquisti, budget residuo per reparto, massima offerta sostenibile
- Scheda giocatore (età, nazionalità, storico stagioni), badge 🎲 scommesse e 🎰 campioni piccoli
- Stato in localStorage + Backup/Ripristino JSON: i dati restano tuoi

## Struttura del repo

| Percorso | Cosa |
|---|---|
| `asta_fantacalcio_2026_27.html` | **Il tool** (single-file, dati embeddati) |
| `players_pen.json` | Dataset giocatori arricchito (stat, formazioni, rigoristi, infortuni) |
| `scripts/serie_a_stats.py` / `scripts/get_understat.py` | Scaricano le statistiche (FBref Big5+B, Understat) |
| `scripts/merge_stats.py` / `merge_understat.py` / `merge_infortuni.py` / `align_pen.py` | Merge dati nel dataset |
| `scripts/build_formazioni.py` / `formazioni_src.json` | Aggregazione probabili formazioni |
| `scripts/preset_fasce.py` | Preset fasce data-driven |
| `fonti_formazioni.md` | Tutte le fonti + procedura di refresh pre-asta |
| `web/` | Landing page Next.js (Vercel) con raccolta email e GA |

## Aggiornare i dati

Vedi `fonti_formazioni.md` per la procedura completa (fetch fonti → merge → rigenerazione
delle costanti `PLAYERS`/`FORMS` nell'HTML). Richiede Python 3 + `pip install soccerdata pandas`,
eseguito dalla root del progetto (gli script in `scripts/` scrivono i CSV/JSON lì).

## Landing (web/)

```bash
cd web && npm install && npm run dev
```

Env (vedi `web/.env.example`): `NEXT_PUBLIC_GA_ID` (Google Analytics),
`TRATTO_KEY`/`NOTIFY_TO`/`FROM_EMAIL` (notifiche iscrizione via tratto.email),
`NEXT_PUBLIC_SITE_URL`. Deploy consigliato: Vercel, root directory `web/`.

## Licenza e crediti

MIT. Dati da fonti pubbliche: quotazioni ufficiali, FBref, Understat, SOS Fanta,
FantaMaster, Eurosport, Goal, Gazzetta dello Sport, fantacalcio.it. Il tool è un
progetto amatoriale non affiliato ad alcuna di queste testate.
