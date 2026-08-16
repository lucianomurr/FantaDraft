# Progetto: Tool Asta Fantacalcio Serie A 2026/27

Questo file dà il contesto a Claude Code per riprendere un lavoro iniziato in Cowork
(app Claude). Leggilo prima di procedere.

## Obiettivo
Costruire e migliorare un tool per gestire l'asta del fantacalcio (lega Classic, 10
squadre, budget 500 crediti, rosa 3 portieri / 8 difensori / 8 centrocampisti / 6
attaccanti). Il tool serve sia per la **preparazione** (mettere i giocatori in fasce di
preferenza + prezzo target) sia per l'**asta live** (segnare acquisti e budget residuo).

## FATTO (16/08/2026): refresh quotazioni (3° giro)
Rilanciato `update_quotazioni.py` su xlsx fresco (login richiesto, Luciano si è
loggato e scaricato). 499→498 giocatori: 4 nuovi (Obrador D. Sassuolo, Romero
D.A. Parma, Penev P. Lecce, Terzic D. Frosinone — tutti `stat:false`, nessun
dato FBref/formazioni/infortuni, normale per profili minori appena aggiunti al
listone), 5 usciti (Lukaku, Ondrejka, Athekame, Samooja, Perez M.). 24
aggiornati (q/f/squadra), incluso un trasferimento reale nel listone stesso
(Frattesi Inter→Lazio). `merge_keeper_ga.py` rilanciato per i nuovi portieri
(Penev resta senza dato, Lecce non è tra le squadre promosse con proxy Serie
B — nessun aggancio disponibile, coerente con gli altri 18 portieri di riserva
già senza dato). Contatori landing/README/POST aggiornati a 498. Formazioni/
infortuni/trasferimenti NON ri-fetchati in questo giro (dato volatile, da
rifare a ridosso dell'asta 2-3/09 come da nota precedente) — solo il listone
quotazioni era da aggiornare oggi.

## FATTO (13/08/2026): fix audit tecnico (a11y + performance + theming)
`/impeccable audit` sul tool ha dato 13/20 (Accettabile). Eseguiti tutti i fix
consigliati:

**Accessibilità**: `ModalShell.tsx` ora ha `role="dialog"`/`aria-modal`/
`aria-label` (nuova prop `title`), focus trap (Tab non esce dalla card),
focus al primo elemento all'apertura, focus restituito al trigger alla
chiusura. Header colonna ordinabili e nome giocatore in `PlayersTable.tsx`/
`PlayerRow.tsx` erano `<th onClick>`/`<span onClick>` non raggiungibili da
tastiera — ora `<button>` dentro (con `aria-sort` sul `<th>`) o direttamente
`<button>`. Card onboarding (strategia budget, Classic/Mantra) erano `<div
onClick>` — ora `role="button"`/`role="radio"` + `tabIndex` + `onKeyDown`
Invio/Spazio. Bottoni chiudi (✕) hanno `aria-label="Chiudi"`. Gerarchia
heading corretta: titoli modale h3→h2, sottosezioni h4→h3 (occhio: `.pcard
h3{font-size:19px}` andava rinominato `.pcard h2` altrimenti la specificity
CSS rompeva silenziosamente lo stile di `.legsec h3`/`.stratcard h3` per via
dell'ordine nel file — controllato).

**Performance**: `PlayerRow` (fino a ~499 istanze) chiamava `useAsta()`
direttamente — qualunque cambio di stato (anche digitare nel campo ricerca)
invalidava il context intero e ri-renderizzava tutte le righe, perché
`React.memo` non blocca un re-render auto-innescato da un hook di context
interno al componente. Fix reale: nuovo `TrackingContext` in
`AstaContext.tsx` con SOLO `getPlayerState`/`setTier`/`setTgt`/`setPaid`/
`setStatus`, memoizzato su `state.st` (non sull'intero `state` come il
context principale) — dato che il reducer fa spread superficiale, `state.st`
mantiene la stessa referenza quando cambiano solo filtri/sort/cfg, quindi
digitare in ricerca o cambiare budget non tocca più le righe. `PlayerRow`
avvolto in `React.memo`, `onOpenCard` in `page.tsx` avvolto in `useCallback`
(altrimenti la nuova reference ad ogni render avrebbe comunque invalidato il
memo). Limite noto: cambiare la fascia di UN giocatore ri-renderizza ancora
tutte le righe visibili (stesso `TrackingContext` condiviso) — accettabile,
molto più raro di search/filtri.

**Theming**: nuovi token `--well`/`--txt2`/`--dim` in `tool.css` per 3 colori
hex ricorrenti mai promossi a variabile (`#0c1019`×4, `#c3cbdb`×3,
`#4a5266`×2). `--dim` (`#6b7690`, ~3.8:1 di contrasto su pannello) sostituisce
il vecchio `#4a5266` (~2.1:1, sotto la soglia 3:1 WCAG) per `.tit0`/`.min-lo`
— NON riusato `--fx` esistente anche se stesso valore hex, per non accoppiare
due concetti diversi (fascia "Evita" vs "nessun dato titolarità") allo stesso
token.

**Responsive**: bottoni fascia (`.tbtn`) da 32×32 a 40×40px sotto 700px
(erano già stati alzati da 22px in una sessione precedente).

Verificato in browser: focus trap, tab-order, Invio su header/card
onboarding/nome giocatore, focus-return alla chiusura — tutti confermati
funzionanti. `resize_window` del tool browser non emula davvero viewport
stretti in questo ambiente (limite noto, già visto in sessione precedente):
verificata la regola mobile `.tbtn` a livello di codice invece che
visivamente.

## FATTO (12/08/2026): refresh dati completo (2° giro)
Rifatto tutto il giro: quotazioni (fantacalcio.it ora richiede LOGIN per
scaricare l'Excel — cambiato da quando funzionava senza, 10/08 — Luciano si è
loggato nel suo browser e mi ha passato il file), formazioni (6 fonti, agent
in parallelo per le 4 generaliste + script dedicati per Gazzetta/Fantacalcio.it),
rigoristi (0 cambi), infortuni (Marianucci: diagnosi affinata da "trauma
contusivo-distorsivo" a "lesione alto grado collaterale mediale", stop
minimo 2 mesi), trasferimenti (128 agganciati, +6 da 122), stats FBref/
Understat (cache riusata correttamente: stagione 2025/26 è chiusa, non
serve rifetchare — i 5 nuovi giocatori dal listone l'hanno comunque presa
dalla cache esistente), gol subiti portieri (invariato, stessa fonte
statica). Risultato: 497→499 giocatori (5 nuovi tra cui Molina N. e Kevin
Carlos, che erano gli "irraggiungibili" delle formazioni — ora risolti;
3 usciti tra cui Djimsiti). Contatori landing/README/POST aggiornati.

## FATTO (11-12/08/2026): peso ruolo su Val + 6a fonte formazioni + pallini ballottaggio
Val giocatori di movimento pesava gol/assist uguale per tutti i ruoli — un gol da
difensore contava come uno da attaccante, mentre nella realtà è molto più raro
(dati reali della rosa: D 1.11 gol/giocatore, C 2.20, A 5.11). Ora
`GOAL_ROLE_WEIGHT` in `scoring.ts` pesa i gol ×4.6 per i difensori e ×2.3 per i
centrocampisti (attaccanti ×1) — solo i gol, non gli assist (differenza per
ruolo molto minore: D 1.07, C 1.82, A 1.96 assist/giocatore). Esempio reale:
Dimarco (D) Val 14→42, McTominay (C) 14→30, Lautaro (A) invariato a 15.

Aggiunta Fantacalcio.it come 6a fonte probabili formazioni
(`scripts/fetch_fantacalcio_formazioni.py` + `build_formazioni_src.py`
append-only sulle altre 5). A differenza delle altre, mostra la PROSSIMA
GIORNATA di campionato (non un preview stagionale) — da rifare a ridosso
dell'asta insieme al resto. Gli URL dei giocatori contengono l'id fantacalcio
ufficiale, stesso id di `players_pen.json`: matching diretto per id in
`build_formazioni.py` (`find_by_id`), niente euristiche di nome per questa
fonte. La pagina lista i titolari in ordine attacco→portiere: il parser lo
inverte per coerenza con le altre 5 (portiere→attacco).

Fix bug ballottaggi: sia il titolare in carica che il contendente in un
ballottaggio prendevano lo stesso flag `ball` — ora `ball` è un conteggio
(0..6, non più 0|1) di quante fonti citano il giocatore in ballottaggio SENZA
essere titolare in quella stessa fonte (chi vince il ballottaggio in una
fonte ha già il suo pallino pieno da lì, non prende doppio credito). UI:
pallino pieno (colore per livello tit) = titolare, pallino semipieno blu
(nuova classe `.titball`) = citato in ballottaggio senza esserlo, vuoto =
né l'uno né l'altro — sempre 6 pallini totali. Logica condivisa in nuovo
`web/lib/formations.ts` (`titBallDots`), usata da `PlayerRow.tsx` e
`PlayerCardModal.tsx`. Fantacalcio.it non contribuisce ancora ballottaggi
(pagina mostra "Nessun ballottaggio" su tutte le 20 squadre, troppo presto
in pre-stagione — da ricontrollare il formato quando compariranno dati reali,
notato che la pagina mostra percentuali ma non legate ai ballottaggi finora).

## FATTO (10/08/2026): Val portieri da gol subiti + fix reset totale
"Reset totale" azzerava solo il tracking (`st`), non `cfg` — budget e le
nuove impostazioni Mantra/modificatore difesa restavano quelle vecchie e
l'onboarding non si riapriva mai (il ref one-shot in `page.tsx` non si
riarmava). Ora `RESET_ALL` riporta `cfg` a `DEFAULT_CFG` e `hadSavedState` a
false; `page.tsx` riarma il ref quando `hadSavedState` passa da true a false,
riaprendo il wizard onboarding come a un primo avvio.

Val per i portieri era sostanzialmente vuoto (formula (3×gol+assist)/FVM,
ma i portieri non fanno gol/assist). Dato individuale "gol subiti": FBref
blocca con CAPTCHA persistente lo scraping automatico (sia la pagina keepers
sia, in alcuni momenti, la pagina standings principale — bloccato IP/
sessione, non solo l'endpoint), ma la pagina è raggiungibile da browser
normale — Luciano ha copiato a mano la tabella "Player Goalkeeping" (Serie A
2025/26, 46 portieri, FBref) e l'ho incollata in `scripts/merge_keeper_ga.py`
(costante `PLAYER_GA`, match per cognome). 31/60 portieri hanno così il dato
individuale REALE (flag `gaIndividual: true`); i restanti (squadre promosse
dalla B — Frosinone/Monza/Venezia — o portieri senza minuti in A 2025/26)
usano il proxy di squadra (gol subiti totali Serie B 2025/26, fonte
Wikipedia, prorata sui minuti giocati) con `gaIndividual: false`. Campi `ga`/
`gaTeam`/`gaIndividual` su `players_pen.json`. Formula (decisa con Luciano
dopo due giri di conti reali che hanno rivelato problemi di scala): Val =
(100 − gol subiti) / FVM × 100, con soglie di esclusione (mostra "—"): <900
minuti (dato non affidabile su campione piccolo) e FVM <3 (sotto quella
soglia il rapporto esplode per i portieri di riserva quasi gratis, es. Val
8000+, senza dire niente sul portiere). Scala diversa dal Val degli altri
ruoli (es. Svilar 106 vs un attaccante 15-20) — non confrontabile
direttamente, spiegato in legenda/tooltip/scheda giocatore (che indica se il
dato è individuale o proxy).

## FATTO (10/08/2026): supporto Mantra + modificatore difesa
Onboarding ora è un wizard a 3 step (`OnboardingModal.tsx`): 1) budget+strategia
(come prima), 2) formato lega Classic/Mantra + modificatore difesa (nuovi campi
`cfg.mantra`/`cfg.modDifesa`, default `false` — retrocompatibili via il merge
già esistente in `storage.ts`), 3) offerta di aprire subito "Preset fasce" per
precompilare. Il toggle resta modificabile anche dopo, da due checkbox in
"Budget & allocazione" (`BudgetPanel.tsx`) — l'onboarding si apre una sola
volta, chi ha già uno stato salvato deve poter cambiare modalità senza rifarlo.

Dati: `RM` (ruoli Mantra, es. "Dd;Dc") e `FVM M` erano già nel listone xlsx ma
scartati da `scripts/update_quotazioni.py` — ora estratti in `rm: string[]` e
`fvmM: number` per ogni giocatore. La rosa d'asta resta identica a Classic
(stesso budget, stessi 4 reparti P/D/C/A, 3/8/8/6 slot) — Mantra NON cambia
`roles.ts`/`budget.ts`/`strategies.ts`, cambia solo quale FVM è "attivo" e i
sotto-ruoli mostrati. Un solo punto di verità: `scoring.ts` espone
`activeFvm(p, mantra)`, e `withDerived` sostituisce `f` col FVM attivo PRIMA
di calcolare Val — tabella/ordinamento/filtri leggono sempre `p.f` come prima,
diventano Mantra-corretti senza altre modifiche.

Preset fasce (`preset.ts`): score usa `activeFvm` invece di `f` fisso, e con
modificatore difesa applica `MODDIFESA_BOOST` (P ×1.15, D ×1.20) — euristica
dichiarata come tale (costante nominata, commentata "da ritarare"), non una
formula fantacalcistica certificata. Soglie R/X invariate (stessa scala FVM
Classic/Mantra nei dati campione).

Tabella: colonna "Ruolo M" (sottoruoli, es. "Dd · Dc") e filtro select ruolo
Mantra compaiono SOLO quando `cfg.mantra` è true — tabella Classic invariata
di default. Scheda giocatore mostra ruoli+FVM Mantra quando la lega è Mantra.

## FATTO (08/08/2026): dominio custom + email iscrizioni live
Sito ora su `https://fantadraft.murruni.it` (Vercel, CNAME su Seeweb DNS: vedi
`fantadraft` → `d19bcd0811372dce.vercel-dns-017.com.`). Dominio verificato anche
su tratto.email (DKIM/SPF/DMARC aggiunti da Luciano su Seeweb) — `FROM_EMAIL`
ora `noreply@fantadraft.murruni.it`. `NEXT_PUBLIC_SITE_URL` aggiornato ovunque
(Vercel env prod, `.env.example`, fallback in `web/app/layout.tsx`) dal vecchio
alias `fantadraft2027-lucianomurrs-projects.vercel.app` (resta valido come URL
di fallback/team, non più quello canonico). ATTENZIONE: le env var
`TRATTO_KEY`/`NOTIFY_TO`/`FROM_EMAIL` NON erano MAI state impostate su Vercel
prod fino a questo aggiornamento — `/api/subscribe` ha risposto 503 dal primo
deploy fino ad ora. Testato end-to-end (curl reale su `/api/subscribe` + email
di verifica ricevuta) dopo il fix.

## FATTO (07/08/2026): rimosso l'export HTML standalone
`asta_fantacalcio_2026_27.html` e `web/public/download/FantaDraft2027.html` sono
stati eliminati (git rm) insieme al link "scarica file singolo" nel footer del
tool. Motivo: dopo il preset fasce interattivo l'HTML avrebbe richiesto un porting
manuale di ogni feature per restare a parità (già indietro, non aveva la modale
preset) — mantenerlo sincronizzato costava più di quanto valesse offrirlo. L'unico
codice vivo è `web/`. Se in futuro serve di nuovo un export offline, valutare un
build step automatico (es. Puppeteer/inlining) invece di duplicare a mano il codice.

## FATTO (07/08/2026): preset fasce interattivo (modale)
Il bottone "✨ Preset fasce" nel tool React ora apre una modale (`web/components/
tool/PresetModal.tsx`) invece di applicare direttamente il campo statico `pt`.
Calcolo interamente client-side in `web/lib/preset.ts` (`computeLivePreset`),
stessa formula di `scripts/preset_fasce.py` ma con parametri regolabili dall'utente:
- **peso titolarità** (slider 0-0.30, default 0.15): quanto la titolarità (0-5
  fonti) pesa nel punteggio = FVM×(0,55+peso×tit)+bonus rigorista
- **aggressività soglie R/X** (slider 0.5-2×, default 1×): scala le soglie FVM
  per Riserva (titolari economici) ed Evita (trappole costose non titolari)
- **quote F1-F4 per ruolo**: tabella editabile 4 ruoli × 4 fasce (default =
  QUOTA di preset_fasce.py: P 3/4/5/0, D 5/7/8/8, C 5/7/8/8, A 4/6/8/8)
- checkbox **"azzera le fasce attuali prima di applicare"**: di default il preset
  tocca solo i giocatori senza fascia (comportamento storico); se spuntata,
  sovrascrive tutte le fasce esistenti

Anteprima live (conteggio giocatori per fascia) ricalcolata a ogni modifica dei
parametri, prima di confermare. Bottoni Applica/Annulla. Il campo statico `pt`
in players_pen.json resta usato SOLO dall'export HTML standalone (che ha ancora
il vecchio bottone one-click, non è stato portato lì per scope/tempo — se si
vuole parità va fatto un port separato del modale in JS vanilla).

## FATTO (07/08/2026): ultimi trasferimenti da API-Football
Chiave dell'utente in `web/.env.local` (`API_FOOTBALL=...`, piano free: 100
richieste/giorno, ~10/minuto — solo uso offline via script, MAI chiamate live dal
sito). Endpoint `/transfers?team={id}` NON è vincolato alla restrizione stagionale
del piano free (a differenza di `/teams`/`/players`/`/fixtures`, limitati a stagioni
2022-2024): dà lo storico completo trasferimenti, incluso il mercato estate 2026.
20 ID squadra Serie A 2026/27 hardcoded in `scripts/get_transfers.py` (TEAM_IDS).

Pipeline: `scripts/get_transfers.py` (fetch, cache in `transfers_raw.json`, filtro
finestra >= 2026-05-01, output `transfers.json`) poi `scripts/merge_transfers.py`
(matching cognome contro players_pen.json, campo `transfer`:
`{dir:"in"|"out", date, from|to, type}`). dir="in" = arrivo confermato nella
squadra listata; dir="out" = **ceduto/prestato da una squadra in cui il listone lo
elenca ancora** (segnale di listone non aggiornato, warning importante pre-asta).

ATTENZIONE bug dati API-Football: per gli svincolati a volte `teams.in` non è
`null` ma `{id:null, name:"<Cognome Nome del giocatore>"}` — get_transfers.py lo
rileva (`id is None`) e normalizza a "Svincolato", altrimenti sembra un trasferimento
verso una squadra che in realtà è il nome del giocatore stesso.

Nel tool: badge 🆕 (verde, arrivo) / 🚪 (rosso, cessione da verificare) accanto al
nome, riga dedicata nella scheda giocatore, voci in legenda. Portato sia nel tool
React (`web/lib/transfers.ts` + componenti) sia nell'export HTML standalone
(stesse funzioni JS duplicate inline, vedi nota sotto su sincronizzazione).

Refresh: rilanciare `get_transfers.py` (cancella prima `transfers_raw.json` se si
vuole rifetchare da zero, altrimenti usa la cache) + `merge_transfers.py`, poi
propagare come da procedura standard (copia in `web/data/players.json` e
rigenera l'HTML). Il segnale è più utile vicino all'asta (2-3 settembre): finestra
`WINDOW_START` in get_transfers.py da aggiornare se si rifà il fetch molto dopo.

## FATTO (07/08/2026): refactor in React/TypeScript
Il tool LIVE ora è `web/app/tool/page.tsx` + componenti in `web/components/tool/`,
logica pura in `web/lib/` (budget.ts, filters.ts, storage.ts, strategies.ts,
scoring.ts, preset.ts, roles.ts, nations.ts, types.ts), stato in
`web/contexts/AstaContext.tsx` (useReducer, persistenza localStorage — stessa
chiave `fanta_asta_2627_v1`, stesso schema `{cfg,st}`). Dati letti da
`web/data/players.json` e `web/data/formazioni.json` (copie di
`players_pen.json`/`formazioni.json`, va rifatta ad ogni aggiornamento dati,
vedi fonti_formazioni.md). `asta_fantacalcio_2026_27.html` NON è più il codice
vivo: resta come export single-file per uso offline, rigenerato con lo stesso
script di sostituzione `const PLAYERS`/`const FORMS` usato finora, poi copiato
in `web/public/download/FantaDraft2027.html` (linkato dal footer del tool).
Se modifichi la UI del tool: edita i file in `web/`, NON l'HTML — l'HTML si
rigenera solo per l'export, non è più la sorgente.

## File del progetto
- `web/` — codice vivo del tool (React/Next.js) e della landing. Stato salvato in
  localStorage (chiave `fanta_asta_2627_v1`) + Backup/Ripristino JSON.
- `players_pen.json` — i 493 giocatori con il flag rigoristi. Sorgente dei dati del tool
  (copiata in `web/data/players.json` a ogni aggiornamento, vedi fonti_formazioni.md).
- `scripts/` — script Python (soccerdata, merge, formazioni, preset). Vedi sotto.
- `build_tool.py` NON è incluso: il tool si modifica direttamente nell'HTML, oppure si
  rigenera. Se serve rigenerare, i dati partono da `players_pen.json` (ordinati per
  ruolo P,D,C,A e poi FVM decrescente).

## Schema di `players_pen.json`
Lista di oggetti con:
- `id`  : id fantacalcio (dal file quotazioni ufficiale)
- `r`   : ruolo Classic — "P" | "D" | "C" | "A"
- `n`   : nome (grafia del file quotazioni, es. "Martinez L.", "Soulè", "Bernabè")
- `s`   : squadra
- `q`   : Qt.A (quotazione base)
- `f`   : FVM (Fantavalore di Mercato, stima del prezzo d'asta — indicatore migliore di q)
- `pen` : rigorista — 0 = no, 1 = designato, 2 = alternativa/seconda scelta

## Funzionalità già implementate nel tool
- Dashboard budget per reparto (allocazione default P35/D75/C105/A285, editabile) con
  spesa, residuo, slot riempiti e "Max su 1 giocatore" (residuo tenendo 1cr per slot vuoto).
- Fasce di preferenza per giocatore: 1 (top) / 2 / 3 / 4 / R (riserva 1cr) / X (evita).
- Prezzo target per giocatore. Tracking live: "Io" (con prezzo pagato) / "Altri".
- Filtri: ruolo, squadra, fascia, ricerca nome, "nascondi presi", "solo miei",
  "solo rigoristi". Ordinamento per nome/squadra/Qt/FVM.
- Rigoristi evidenziati con badge pallone: oro = designato (pen=1), sbiadito = alternativa
  (pen=2). Gerarchie allineate a Gazzetta il 06/08/2026 (script scripts/align_pen.py, 20 designati + 36 alternative); prima erano SOS Fanta / Sky.

## FATTO (06/08/2026): statistiche FBref integrate
Merge completato: 445/493 giocatori con dati (Big 5 + Serie B via league_dict.json) (campi gls/ast/pk/pkatt/min/mp/starts/sea/src/stat
in `players_pen.json`, colonne G/Rig/A/Min/Val nel tool, badge 🎲 per i 48 senza dati).
`stats_merge_report.txt` = lista senza dati + match cross-team da revisionare.
ATTENZIONE: FBref NON pubblica più xG — RISOLTO il 06/08/2026 con Understat
(via soccerdata, `understat_full.csv`, script `scripts/merge_understat.py`): campi
`xg`,`xa`,`npxg`,`sh` (tiri),`kp` (key passes) per 411/445 con stat; colonne
xG/xA in tabella + riquadri nella scheda. Understat NON copre la Serie B.
Val = (3*gls+ast)/FVM*100 (invariato, su dati reali).
`players_pen.backup.json` = file originale pre-merge.

## FATTO (06/08/2026): probabili formazioni (3 fonti)
Campi `tit` (0-3: in quanti XI titolari appare) e `ball` (1=citato in ballottaggio) in
`players_pen.json`. Fonti (5): SOS Fanta, FantaMaster, Eurosport, Goal, Gazzetta (scala tit 0-5; calciomercato.com non estraibile, JS). Dati per-squadra in `formazioni.json` +
embeddati nell'HTML come const FORMS. Nel tool: colonna Tit (●●● ordinabile, ⚖ =
ballottaggio), filtro "Titolari (≥2 fonti)", pannello "Probabili formazioni" con
select squadra e confronto 3 fonti. Nomi articolo non nel listone (Laerke, Gutierrez,
Fortini, Pierret) mostrati in corsivo nel pannello, senza aggancio.

## Passo originale (completato): statistiche reali da FBref (soccerdata)
Motivo: arricchire ogni giocatore con gol, rigori (PK/PKatt), assist, xG e minuti della/e
ultima/e stagione/i, per decidere fasce e prezzi sui numeri. Include i NUOVI arrivi in
Serie A: `scripts/serie_a_stats.py` scarica i "Big 5 European Leagues Combined" (2 stagioni), così
chi arriva da Premier/Liga/Bundesliga/Ligue1 è coperto. Serie B / Eredivisie / Portogallo /
Championship: lo script prova a scaricarli ma potrebbero richiedere di aggiungere il
campionato alla config di soccerdata (`~/soccerdata/config/league_dict.json`).

### Come eseguire (qui in locale hai rete, quindi funziona)
    pip install soccerdata pandas
    python3 scripts/serie_a_stats.py
Produce `big5_stats_full.csv` (+ eventuale `extra_leagues_full.csv`).

### Merge da fare dopo lo scarico
Fondere le stat dentro `players_pen.json` (aggiungere campi tipo `gls`,`ast`,`pk`,`pkatt`,
`xg`,`min`) e poi rigenerare/aggiornare l'HTML aggiungendo le colonne + eventuale ordinamento.
Abbinamento nomi: per i giocatori GIÀ in Serie A match per squadra+cognome (con
normalizzazione accenti). Per i NUOVI arrivi la squadra non coincide: match per nome +
nazionalità + anno di nascita (`nation`, `born` in FBref) per evitare omonimi. Produrre una
lista dei giocatori rimasti senza aggancio da sistemare a mano; chi resta senza dati va
marcato come "esordiente/scommessa", non lasciato ambiguo.

Nota onesta: FBref NON dà la fantamedia italiana (voti dei pagellisti), solo prestazioni reali.

## SPECIFICA — come integrare le statistiche nel tool (preferenze confermate da Luciano)

### Campi da aggiungere a ogni giocatore in `players_pen.json`
Usare i numeri TOTALI di stagione (non per-90). Prendere la stagione più recente
disponibile per quel giocatore: prima `2526`, se assente `2425` (registrare quale).
- `gls`   : gol totali (Performance_Gls)
- `ast`   : assist (Performance_Ast)
- `pk`    : rigori segnati (Performance_PK)
- `pkatt` : rigori calciati (Performance_PKatt)
- `xg`    : expected goals totali, 1 decimale (Expected_xG)
- `min`   : minuti giocati (Playing Time_Min)
- `mp`    : partite giocate; `starts` : da titolare (Playing Time_MP / _Starts)
- `sea`   : stagione fonte del dato ("2526" | "2425")
- `src`   : campionato fonte (es. "ITA-Serie A", "ENG-Premier League")
- `stat`  : true se ha dati, false se esordiente/senza dati

### Colonne da mostrare in tabella (tutte e 4 le famiglie richieste)
Aggiungere dopo la colonna FVM, numeri interi salvo xG (1 decimale):
- **G** = gol (`gls`)
- **Rig** = rigori come "segnati/tirati" (es. "5/6"); vuoto se pkatt=0
- **A** = assist (`ast`)
- **xG** = `xg`
- **Min** = minuti; indicatore titolarità: verde se `min` >= 1800, giallo 900–1799,
  grigio < 900 (stagione piena ~3400 min). Mostrare `starts` nel tooltip.
Tutte le nuove colonne devono essere ordinabili (come Qt/FVM).

### Punteggio di convenienza ("Val") + ordinamento — RICHIESTO
Indicatore di affare = bonus attesi rapportati al prezzo. Trasparente e basato su dati reali:
    bonusAttesi = 3*gls + 1*ast          // punti bonus stagionali approssimati (Classic)
    Val = round( bonusAttesi / f * 100 ) // f = FVM; bonus per 100 crediti di valore
- Colonna **Val**, ordinabile (default utile: decrescente per trovare gli affari).
- Calcolare Val SOLO se `stat` è true e `f` > 0; altrimenti mostrare "—".
- NB: i rigori sono già dentro `gls`, non contarli due volte. Il flag `pen` resta
  separato (indica CHI tira, non quanti ha segnato).

### Gestione dati mancanti
Giocatori senza aggancio FBref: lasciare le celle stat vuote ("—") e marcarli con un tag
"scommessa" (es. badge o classe CSS) accanto al nome; NON calcolare Val per loro.
A fine merge, stampare/consegnare la lista dei "senza dati" e dei match dubbi (omonimi)
per la revisione manuale.

### Abbinamento nomi (ricordare)
- Già in Serie A: match per squadra + cognome, normalizzando gli accenti
  (il file usa accenti gravi: "Soulè", "Bernabè").
- Nuovi arrivi (squadra diversa): match per nome + nazionalità + anno di nascita
  (`nation`, `born` in FBref) per non confondere omonimi.

## FATTO (06/08/2026): scheda giocatore
Click sul nome (sottolineato a puntini) -> modale con: nazionalità (`nat`), età/classe
(`born`), Qt/FVM/Val/Min, storico stagioni (`hist`: righe separate per stagione+tappa,
da FBref, entrambe le stagioni scaricate). Chi è senza dati -> toast "scommessa".
Campi aggiunti da scripts/merge_stats.py.

## FATTO (06/08/2026): infortunati
`infortuni.json` (fonte fantacalcio.it/infortunati-serie-a, campo "aggiornato") +
`scripts/merge_infortuni.py` -> campo `inj` {d: prognosi, r: rientro} in players_pen.json.
Nel tool: badge 🚑 rosso accanto al nome (tooltip prognosi+rientro), riga rossa nella
scheda giocatore, voce in legenda. DA RIAGGIORNARE 1-2 giorni prima dell'asta
(dato volatile): rifare fetch pagina, riscrivere infortuni.json, rilanciare script + regen.

## FATTO (06/08/2026): preset fasce
Campo `pt` in players_pen.json (119 giocatori): fascia suggerita. Formula: punteggio =
FVM*(0.55+0.15*tit) + 12 se pen==1 (+4 se pen==2); quote per ruolo F1/F2/F3/F4
(P 3/4/5/0, D 5/7/8/8, C 5/7/8/8, A 4/6/8/8); R = titolari (tit>=2) con FVM basso
(P<=15,D<=6,C<=6,A<=10); X = FVM alto ma tit==0 (trappole). Bottone "✨ Preset fasce"
nel tool: riempie SOLO le fasce vuote, mai le scelte manuali. Script:
scripts/preset_fasce.py.

## Come consegnare all'utente (Luciano)
Il tool è un file HTML: basta aprirlo nel browser. Prima dell'asta usare "Backup" per
esportare lo stato. Aprirlo sempre dallo stesso browser (lo stato è in localStorage).
