# Fonti probabili formazioni — da riaggiornare 1-2 giorni prima dell'asta (2/3 settembre 2026)

Procedura (dalla root del progetto): rifare il fetch di TUTTE le fonti sotto,
ricostruire `formazioni_src.json` (stesso formato: sources[].teams.{squadra}.{mod,xi[11],ball[][]}), poi:
    python3 scripts/build_formazioni.py   # ricalcola tit/ball + formazioni.json
    python3 scripts/preset_fasce.py       # (opzionale) ricalcola preset pt di riferimento
    cp players_pen.json web/data/players.json     # il tool live legge da qui
    cp formazioni.json web/data/formazioni.json

## Fonti già usate (06/08/2026)
- SOS Fanta: https://www.sosfanta.com/asta-fantacalcio/seriea-tutte-formazioni-tipo-fantacalcio-2026-2027-asta-consigli-chi-prendere/
- FantaMaster: https://www.fantamaster.it/probabili-formazioni-seriea-2026-2027-moduli-titolari-ballottaggi/
- Eurosport: https://www.eurosport.it/calcio/serie-a/2026-2027/fantacalcio-formazioni-tipo-serie-a-come-giocheranno-e-chi-sono-i-titolari-delle-20-squadre-dopo-il-calciomercato-estivo_sto23324751/story.shtml
- Calciomercato.com (NON estraibile via fetch, gallery JS — servono i browser tool):
  https://www.calciomercato.com/liste/serie-a-2026-2027-come-giocheranno-le-20-squadre-iscritte-tra-conferme-e-nuovi-arrivi/bltadd36b67773d1676#csfd8312a5ca5b5afb

## Nuove fonti (da Luciano, 06/08/2026)
- Goal: https://www.goal.com/it/liste/fantacalcio-formazioni-titolari-serie-a-2026-2027-tutte-le-squadre-tipo/blt5527c89487e5b7d3

### Gazzetta (una pagina per squadra: titolari + rigorista + sorprese)
- Atalanta: https://www.gazzetta.it/calcio/fantanews/02-08-2026/atalanta-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml
- Bologna: https://www.gazzetta.it/calcio/fantanews/03-08-2026/bologna-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml
- Cagliari: https://www.gazzetta.it/calcio/fantanews/04-08-2026/cagliari-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml
- Como: https://www.gazzetta.it/calcio/fantanews/04-08-2026/como-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml
- Fiorentina: https://www.gazzetta.it/calcio/fantanews/02-08-2026/fiorentina-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml
- Frosinone: https://www.gazzetta.it/calcio/fantanews/02-08-2026/frosinone-al-fantacalcio-2026-27-titolari-rigorista-sorprese-e-consigli-su-chi-prendere.shtml
- Genoa: https://www.gazzetta.it/calcio/fantanews/04-08-2026/genoa-al-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml
- Inter: https://www.gazzetta.it/calcio/fantanews/05-08-2026/inter-al-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml
- Juventus: https://www.gazzetta.it/calcio/fantanews/03-08-2026/juve-al-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml
- Lazio: https://www.gazzetta.it/calcio/fantanews/02-08-2026/lazio-al-fantacalcio-2026-27-titolari-rigorista-sorprese-e-consigli-su-chi-prendere.shtml
- Lecce: https://www.gazzetta.it/calcio/fantanews/04-08-2026/lecce-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml
- Milan: https://www.gazzetta.it/calcio/fantanews/02-08-2026/milan-al-fantacalcio-2026-27-titolari-rigorista-sorprese-e-consigli-su-chi-prendere.shtml
- Monza: https://www.gazzetta.it/calcio/fantanews/05-08-2026/monza-al-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml
- Napoli: https://www.gazzetta.it/calcio/fantanews/02-08-2026/napoli-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml
- Parma: https://www.gazzetta.it/calcio/fantanews/03-08-2026/parma-al-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml
- Roma: https://www.gazzetta.it/calcio/fantanews/03-08-2026/roma-al-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml
- Sassuolo: https://www.gazzetta.it/calcio/fantanews/04-08-2026/sassuolo-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml
- Torino: https://www.gazzetta.it/calcio/fantanews/03-08-2026/torino-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml
- Udinese: https://www.gazzetta.it/calcio/fantanews/03-08-2026/udinese-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml
- Venezia: https://www.gazzetta.it/calcio/fantanews/04-08-2026/venezia-al-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml

## Stato 06/08/2026: Goal + Gazzetta GIÀ INTEGRATE (5 fonti attive)
- WebFetch su gazzetta.it è bloccato: scaricare con `curl -A "Mozilla/5.0..."` — il testo
  completo dell'articolo sta nel JSON-LD `articleBody` (non serve il paywall).
- Il blocco XI nella Gazzetta è nel body: `(modulo): XI. Allenatore: X. Calci di rigore: ...`
- Al refresh pre-asta: riscaricare tutte e 5 e ricostruire formazioni_src.json.

## Fantacalcio.it (aggiunta 11/08/2026, 6a fonte)
- URL: https://www.fantacalcio.it/probabili-formazioni-serie-a — pagina UNICA con
  tutte le 20 squadre (non una pagina per squadra come Gazzetta).
- ATTENZIONE: a differenza delle altre 5, questa mostra la **prossima giornata di
  campionato** (es. "Giornata 1"), non un preview stagionale — dopo che si è giocata
  quella giornata i dati diventano quelli della successiva. Va rifatta a ridosso
  dell'asta insieme al resto per essere davvero utile (non ha senso rifetcharla in
  isolamento a metà tra due refresh).
- Gli URL dei giocatori nell'HTML contengono l'id fantacalcio ufficiale (es.
  `.../martinez-jo/5116` → id 5116), lo stesso id di `players_pen.json`: matching
  DIRETTO per id in `build_formazioni.py` (bypassa tutte le euristiche di nome
  usate per le altre 5 fonti — niente ALIAS/fuzzy da mantenere per questa).
- Script dedicati (fetch + parse in un solo step, poi merge):
    python3 scripts/fetch_fantacalcio_formazioni.py   # scrive fantacalcio_it_src.json
    python3 scripts/build_formazioni_src.py           # aggiunge/sostituisce SOLO questa fonte in formazioni_src.json
    python3 scripts/build_formazioni.py               # come sempre, ricalcola tit/ball su tutte le 6 fonti
  `build_formazioni_src.py` NON tocca le altre 5 fonti già presenti nel file — per
  rifarle da zero serve comunque il fetch manuale di ciascuna (vedi sopra).

## Percentuali di titolarità per la giornata corrente (aggiunto 02/09/2026)
- URL: https://www.sosfanta.com/lista-formazioni/probabili-formazioni-serie-a/ —
  a differenza delle 6 fonti sopra (preview stagionale, conteggio 0-6), questa
  pagina è specifica per la PROSSIMA giornata di campionato e dà una
  percentuale 0-100 per ogni giocatore (titolari, ballottaggi, panchina).
  Usata da `web/lib/lineup.ts` per suggerire la formazione da schierare
  dalla propria rosa dopo l'asta — dato molto più volatile delle altre
  fonti, va rifatto ogni settimana prima di ogni giornata, non solo pre-asta.
- Script dedicati:
    python3 scripts/fetch_sosfanta_percentuali.py   # scrive sosfanta_percentuali.json
    python3 scripts/merge_startpct.py                # aggancia startPct + scrive web/data/giornata.json
  Poi come sempre: `cp players_pen.json web/data/players.json`.
- Matching per nome scoped alle 2 squadre del match (stesso stile euristico
  delle altre fonti) — alla prima esecuzione 484/487 agganciati, i residui
  erano un giocatore non ancora nel listone e un'ambiguità genuina tra due
  omonimi Milan (Terracciano / Terracciano F.), non risolvibile senza altro
  contesto dalla pagina.

## Seconda fonte percentuali titolarità: Gazzetta (aggiunto 03/09/2026)
- URL hub: https://www.gazzetta.it/Calcio/prob_form/ — elenca le 10 partite
  della giornata corrente, ognuna con un link "vista testuale"
  (`http://www.gazzetta.it/Calcio/prob_form/?match={id}`) che contiene in
  realtà TUTTE e 10 le partite nella stessa pagina (basta un fetch, non uno
  per partita). WebFetch bloccato su gazzetta.it come sempre: curl con UA
  browser.
- Dà titolari (via HTML strutturato `lineup-team__name`, non testo libero),
  ballottaggi CON percentuale ("Nome-Nome NN-MM%"), panchina e indisponibili
  — NON dà i rigoristi (quelli restano solo nelle 20 pagine "Formazione-
  tipo" stagionali già usate per `align_pen.py`).
- Script dedicato: `python3 scripts/fetch_gazzetta_percentuali.py` scrive
  `gazzetta_percentuali.json`, stesso formato di `sosfanta_percentuali.json`
  ({"matches": [{home, away, players: [{n, pct}]}]}).
- `scripts/merge_startpct.py` ora incrocia ENTRAMBE le fonti (SOS Fanta +
  Gazzetta): se un giocatore è agganciato da entrambe, `startPct` è la
  media; se solo una lo copre, usa quella. Refresh completo per la
  giornata corrente:
    python3 scripts/fetch_sosfanta_percentuali.py
    python3 scripts/fetch_gazzetta_percentuali.py
    python3 scripts/merge_startpct.py
    cp players_pen.json web/data/players.json
  `web/data/giornata.json` ora ha anche `fonti: [...]`, mostrato nel
  modale "Formazione consigliata".

## Infortunati (aggiunto 06/08/2026)
- Fonte: https://www.fantacalcio.it/infortunati-serie-a (WebFetch funziona)
- Refresh: aggiornare `infortuni.json` + `python3 scripts/merge_infortuni.py` + regen HTML.
- PRIORITARIO al refresh pre-asta: è il dato più volatile di tutti.

## Voti reali per giornata (aggiunto 04/09/2026)
- URL: https://www.fantacalcio.it/voti-fantacalcio-serie-a/2026-27/{giornata} —
  pagina server-rendered con voto+fantavoto (fonte Redazione Fantacalcio) per
  ogni giocatore che ha giocato quella giornata. L'URL del giocatore contiene
  l'id ufficiale fantacalcio (es. `.../atalanta/carnesecchi/4431`), stesso id
  di `players_pen.json` — match diretto per id, niente euristiche di nome.
  Il bottone "Scarica" (Excel) è dietro login (`only-for-logged`), NON
  usabile senza credenziali salvate (decisione presa: non le salviamo) — si
  scrapa invece la tabella HTML già server-side, che contiene lo stesso dato.
- Uso ESPLICITAMENTE limitato a storico informativo nella scheda giocatore
  (campo `voti: [{g, v, fv}]`) — NON entra nella formula Val (che resta
  basata su xG/gol) né in nessun'altra formula del tool. Scelta di Luciano,
  04/09/2026, per non toccare un punteggio già usato per le fasce.
- Script dedicati:
    python3 scripts/fetch_voti.py [giornate...]   # default 1 2, scrive voti.json
    python3 scripts/merge_voti.py                  # aggancia a players_pen.json
  Poi come sempre: `cp players_pen.json web/data/players.json`.
- Da rifare ogni settimana dopo la giornata giocata, aggiungendo il nuovo
  numero di giornata all'elenco (es. `fetch_voti.py 3` dopo la giornata 3).

## Note per il refresh pre-asta
- Gazzetta dà anche il RIGORISTA per squadra: usarlo per verificare/aggiornare `pen` in players_pen.json.
- Con 5 fonti la colonna Tit passa a scala 0-5: aggiornare tooltip/soglie (filtro "≥2 fonti" → valutare "≥3").
- Ricontrollare anche le gerarchie rigoristi e i nuovi acquisti mancanti dal listone.
