# Fonti probabili formazioni — da riaggiornare 1-2 giorni prima dell'asta (2/3 settembre 2026)

Procedura (dalla root del progetto): rifare il fetch di TUTTE le fonti sotto,
ricostruire `formazioni_src.json` (stesso formato: sources[].teams.{squadra}.{mod,xi[11],ball[][]}), poi:
    python3 scripts/build_formazioni.py   # ricalcola tit/ball + formazioni.json
    python3 scripts/preset_fasce.py       # (opzionale) ricalcola preset pt
    # poi rigenerare const PLAYERS e const FORMS nell'HTML (vedi CLAUDE.md)
    cp players_pen.json web/data/players.json     # 07/08/2026: il tool live è React, legge da qui
    cp formazioni.json web/data/formazioni.json
    cp asta_fantacalcio_2026_27.html web/public/download/FantaDraft2027.html  # export offline

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

## Infortunati (aggiunto 06/08/2026)
- Fonte: https://www.fantacalcio.it/infortunati-serie-a (WebFetch funziona)
- Refresh: aggiornare `infortuni.json` + `python3 scripts/merge_infortuni.py` + regen HTML.
- PRIORITARIO al refresh pre-asta: è il dato più volatile di tutti.

## Note per il refresh pre-asta
- Gazzetta dà anche il RIGORISTA per squadra: usarlo per verificare/aggiornare `pen` in players_pen.json.
- Con 5 fonti la colonna Tit passa a scala 0-5: aggiornare tooltip/soglie (filtro "≥2 fonti" → valutare "≥3").
- Ricontrollare anche le gerarchie rigoristi e i nuovi acquisti mancanti dal listone.
