# FantaDraft2027 — tool gratuito per l'asta del fantacalcio Serie A 2026/27

Zero account: apri il tool nel browser e prepari l'asta coi numeri. Completamente
**gratuito e open source**.

**➡️ Tool: `/tool` sulla landing** (app React componentizzata) — oppure, per uso
offline zero-dipendenze, scarica il file HTML singolo da `/download/FantaDraft2027.html`
sulla landing, o apri direttamente `asta_fantacalcio_2026_27.html` da questo repo
(stessa UI, dati incorporati, generato dagli stessi script — non più il codice vivo).

## Cosa fa

- **493 giocatori** con quotazioni ufficiali 2026/27 (Qt + FVM)
- **Statistiche reali** di 2 stagioni da FBref (gol, rigori, assist, minuti, titolarità) —
  Big 5 europei + Serie B, quindi anche neopromossi e nuovi arrivi
- **xG e xA da Understat** per distinguere chi è forte da chi è stato fortunato
- **Probabili formazioni aggregate da 5 fonti** (SOS Fanta, FantaMaster, Eurosport, Goal,
  Gazzetta): colonna Tit = in quanti XI su 5 parte titolare
- **Rigoristi** (gerarchie Gazzetta: designato + alternative) e **infortunati** (prognosi + rientro)
- **Ultimi trasferimenti** (API-Football): badge 🆕 per i nuovi arrivi, 🚪 quando il
  listone ha ancora un giocatore ceduto/prestato altrove — occhio prima di puntarci
- **Val**: indice di convenienza trasparente = (3×gol + assist) / FVM × 100
- **Preset fasce** data-driven + fasce personali 1/2/3/4/R/X con prezzi target
- **Asta live**: tracking acquisti, budget residuo per reparto, massima offerta sostenibile
- Scheda giocatore (età, nazionalità, storico stagioni), badge 🎲 scommesse e 🎰 campioni piccoli
- Stato in localStorage + Backup/Ripristino JSON: i dati restano tuoi

## Struttura del repo

| Percorso | Cosa |
|---|---|
| `asta_fantacalcio_2026_27.html` | Export single-file del tool (dati embeddati, uso offline) |
| `players_pen.json` | Dataset giocatori arricchito (stat, formazioni, rigoristi, infortuni) |
| `scripts/serie_a_stats.py` / `scripts/get_understat.py` | Scaricano le statistiche (FBref Big5+B, Understat) |
| `scripts/merge_stats.py` / `merge_understat.py` / `merge_infortuni.py` / `align_pen.py` | Merge dati nel dataset |
| `scripts/build_formazioni.py` / `formazioni_src.json` | Aggregazione probabili formazioni |
| `scripts/preset_fasce.py` | Preset fasce data-driven |
| `scripts/get_transfers.py` / `merge_transfers.py` | Ultimi trasferimenti (API-Football, campo `transfer`) |
| `fonti_formazioni.md` | Tutte le fonti + procedura di refresh pre-asta |
| `web/` | Landing Next.js **+ tool live** (`/tool`), vedi sotto |
| `web/lib/` | Logica pura (budget, filtri, storage, strategie, scoring/xG) — no DOM |
| `web/contexts/AstaContext.tsx` | Stato del tool (reducer + persistenza localStorage) |
| `web/components/tool/` | Componenti React del tool (tabella, modali, pannelli) |
| `web/data/*.json` | Copia di `players_pen.json`/`formazioni.json` per l'app |

## Aggiornare i dati

Vedi `fonti_formazioni.md` per la procedura completa (fetch fonti → merge). Richiede
Python 3 + `pip install soccerdata pandas`, eseguito dalla root del progetto (gli
script in `scripts/` scrivono i CSV/JSON lì). Dopo il merge, per propagare i dati:

```bash
# 1. copia i dataset aggiornati nell'app
cp players_pen.json web/data/players.json
cp formazioni.json web/data/formazioni.json

# 2. rigenera anche l'export single-file (regen const PLAYERS/FORMS nell'HTML, vedi CLAUDE.md)
cp asta_fantacalcio_2026_27.html web/public/download/FantaDraft2027.html
```

## Landing + tool (web/)

```bash
cd web && npm install && npm run dev
```

Env (vedi `web/.env.example`): `NEXT_PUBLIC_GA_ID` (Google Analytics),
`TRATTO_KEY`/`NOTIFY_TO`/`FROM_EMAIL` (notifiche iscrizione via tratto.email),
`NEXT_PUBLIC_SITE_URL`. Deploy consigliato: Vercel, root directory `web/`.
`API_FOOTBALL_KEY` serve solo allo script offline dei trasferimenti, mai al sito live.

## Licenza e crediti

MIT. Dati da fonti pubbliche: quotazioni ufficiali, FBref, Understat, SOS Fanta,
FantaMaster, Eurosport, Goal, Gazzetta dello Sport, fantacalcio.it. Il tool è un
progetto amatoriale non affiliato ad alcuna di queste testate.
