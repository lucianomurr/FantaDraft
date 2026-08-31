# Progetto: Tool Asta Fantacalcio Serie A 2026/27

Questo file dà il contesto a Claude Code per riprendere un lavoro iniziato in Cowork
(app Claude). Leggilo prima di procedere.

## Obiettivo
Costruire e migliorare un tool per gestire l'asta del fantacalcio (lega Classic, 10
squadre, budget 500 crediti, rosa 3 portieri / 8 difensori / 8 centrocampisti / 6
attaccanti). Il tool serve sia per la **preparazione** (mettere i giocatori in fasce di
preferenza + prezzo target) sia per l'**asta live** (segnare acquisti e budget residuo).

## FATTO (31/08/2026): stagione 2026/27 nello storico giocatore (2 giornate)
Richiesta di Luciano: vedere anche i dati della stagione in corso, non solo
2025/26 e 2024/25. Deciso di NON farla diventare la stagione primaria (quella
che guida gol/assist/xG/Val in tabella) — 2 giornate sono un campione troppo
piccolo, un gol da 2 partite distorcerebbe il Val (stessa ragione per cui il
24/08 avevo rimandato lo switch completo di qualche settimana). Soluzione
via di mezzo: la 2026/27 compare come riga IN PIÙ nello storico stagioni
della scheda giocatore, `merge_stats.py` resta invariato (preferenza
2526→2425 per i campi primari) — `hist_of()` prende già TUTTE le stagioni
disponibili per la persona nel csv, quindi basta aggiungere le righe 2627
al csv perché compaiano nello storico, senza toccare la logica di scelta
della stagione primaria.

Nuovo script `scripts/fetch_2627_stats.py` (soccerdata, Big 5 + Serie B,
`SEASONS=["2627"]`, append idempotente ai csv esistenti — non li sovrascrive).
Serviva reinstallare l'ambiente: il venv di sessioni precedenti
(`/tmp/fanta_venv`) era vuoto/rotto (probabile pulizia di `/tmp` tra una
sessione e l'altra — `/tmp` non è persistente), ricreato da zero
(`/tmp/fanta_venv2`, `pip install soccerdata pandas`). Il fetch FBref ha
funzionato nonostante il blocco CAPTCHA che impedisce curl/WebFetch diretti
— soccerdata usa un chromedriver headless sotto al cofano, non la stessa
strada bloccata.

Bug collaterale trovato e sistemato: `merge_stats.py` azzera SEMPRE il
campo `xg` a `None` prima di riscrivere (`pack()` → `p.update(found)`),
perché nel flusso normale viene sempre seguito da `merge_understat.py` che
lo ripopola — girato da solo per errore ha cancellato l'xG di tutti i
524 giocatori per qualche minuto. Rilanciato `merge_understat.py` (cache
`understat_full.csv` riusata, 2025/26 chiusa) per ripristinarlo.

UI: `PlayerCardModal.tsx` aveva la label stagione nello storico hardcoded
su due sole opzioni (`sea==="2526" ? "2025/26" : "2024/25"` — qualunque
altra stagione, inclusa la nuova 2627, sarebbe finita etichettata
erroneamente "2024/25"). Sostituito con una mappa `SEASON_LABEL` che copre
tutte e 3 le stagioni. Verificato in browser: riga "2026/27 · Serie A ·
Inter · 2 presenze · 180 min · 0 gol" in cima allo storico di Dimarco,
Val/FVM/tabella invariati (basati ancora su 2025/26).

## FATTO (31/08/2026): giro completo (8°) — 524 giocatori, mercato di chiusura
Ultimo giorno di calciomercato (chiude 1/09, asta 2-3/09). Rifatto tutto:
trasferimenti prima (165 agganciati, 155 arrivi), poi formazioni — 46 non
agganciati su 6 fonti (molto più del solito ~0.7%), ma quasi tutti stessi
nomi ripetuti su più fonti indipendenti (Kessie, Theate, Folorunsho,
Fabbian, Van der Brempt, Beto, Bobcek...): segnale forte che erano acquisti
last-minute non ancora nel listone, non errori delle fonti. Confermato dal
giro quotazioni subito dopo: 517→524 (+13/-6), e tra i nuovi c'erano
ESATTAMENTE quei nomi (Kessiè, Theate, Fabbian, Perri, Bobcek, Drobnic).
Rilanciato `build_formazioni.py` dopo: non agganciati 46→11. Stesso
pattern già visto con Spence il 21/08 — quando le fonti formazioni sono più
aggiornate del listone ufficiale, il gap si chiude da solo al giro
quotazioni successivo, non serve inseguire ogni nome a mano.

Rigoristi: Milan cambiato (Leao ceduto, esce; Modric nuovo alternativo
insieme a Ramos), Sassuolo aggiunge Esposito (non ancora nel listone al
momento del check, risolto dal refresh quotazioni). Infortuni 38/38,
trasferimenti 165 (155 arrivi). Contatori landing ricontati: 427 con dati
stat, 447 con xG, 154 arrivi tracciati.

## FATTO (27/08/2026): giro completo (7°) — 517 giocatori, giornata 2 giocata
Quotazioni 515→517 (+9/-7, **230 aggiornati** — FVM molto mossi con la
giornata 2, es. Malen 365→414, Frattesi 55→68, Leao 120→75). Trasferimenti
reali confermati nel listone stesso: Pinamonti Sassuolo→Lazio, Ilic
Torino→Lecce — coerenti con l'uscita del rigorista Pinamonti da Sassuolo
in `align_pen.py` (Gazzetta) nello stesso giro.

Bug SOS Fanta nuovo: il regex generico che catturava il nome squadra prima
di "Formazione-tipo:" ha agganciato per sbaglio "GRATUITA LECCE" (un
banner pubblicitario tutto maiuscolo appena sopra il paragrafo Lecce),
perdendo la riga intera. Fix: invece di un regex generico "cattura
maiuscole", ora cerca ogni nome squadra ESATTO (`re.escape(NOME) +
" Formazione-tipo:"`) uno per uno — niente più falsi positivi da testo
circostante tutto maiuscolo. FantaMaster: stessi bug ricorrenti già visti
(Cagliari "Adopo" duplicato — innocuo, si tronca a 11 comunque; Inter senza
delimitatore "ALL." dopo l'XI, testo prosa si incolla; stavolta anche
Venezia stesso identico bug — patchati a mano come nei giri precedenti).

Non agganciati formazioni: 8/1320 (0.6%), tutti refusi propri delle fonti
o giocatori appena usciti dal listone (Nkunku, ceduto, citato ancora da
Gazzetta come rigorista Milan). Trasferimenti 156 agganciati (147 arrivi).
Infortuni 38/38. Contatori landing aggiornati ai numeri reali ricontati da
`players_pen.json` (non solo incrementati a occhio): 433 con dati stat,
440 con xG, 147 arrivi tracciati.

## FATTO (27/08/2026): landing disallineata dalle feature recenti
Chiesto da Luciano: "la landing con le spiegazioni è aggiornata?" — risposta
onesta era no, su più fronti. Fix:
- Contatori `FontiList` fermi a vecchi refresh: "453 con dati"→440, "417
  coperti"→436, "121 arrivi tracciati"→144 (contati a mano da
  `players_pen.json` corrente, non solo aggiornati a memoria).
- Copy "Niente account, niente installazioni" (hero) e "Nessuna
  installazione" (step 1 "Come funziona") erano diventate FALSE dopo il PWA
  del 26/08 — riscritte per riflettere che l'installazione è ora possibile
  (opzionale, non obbligatoria).
- Aggiunto un 4° step "Dal telefono, modalità asta dedicata" (prima
  mancava del tutto la modalità mobile + sync multi-device, la feature più
  grossa degli ultimi due giorni) — la vecchia card "alternative simili"
  scala da step 4 a step 5.

## FATTO (27/08/2026): fix bottone "Inizia asta" invisibile + Sync anche da desktop
Luciano ha verificato con l'emulatore device di Chrome DevTools (Pixel 7,
412px — affidabile, a differenza del tool resize_window di questa sessione
che NON emula davvero il viewport, limite già noto) che "Inizia asta"
restava invisibile pure sotto 700px. Bug reale, non un problema del device:
in `tool.css` avevo `.live-enter{display:none}` (regola base) scritto DOPO
la media query `@media(max-width:700px){.live-enter{display:inline-flex}}`
invece che prima. Stessa specificità (una classe) → vince l'ultima regola
nell'ordine del sorgente, quindi il `display:none` incondizionato
sovrascriveva SEMPRE quello mobile, a qualunque larghezza. Spostata la
regola base prima della media query (vicino a `.tools`) — verificato
leggendo l'ordine reale delle regole nel CSSOM caricato dal browser, non
solo il sorgente.

Luciano ha fatto anche una domanda di prodotto giusta: il bottone Sync era
raggiungibile SOLO dentro "Inizia asta" (mobile-only), quindi da desktop
non c'era alcun modo di generare/leggere un codice da appaiare al telefono.
`SyncControl` estratto da `LiveAuctionMode.tsx` in un componente condiviso
(`SyncControl.tsx`, legge `syncCode`/`syncStatus`/`startSync`/`stopSync`
direttamente da `useAsta()`, zero prop-drilling) e montato anche in
`Header.tsx`, sempre visibile. Nel nuovo contesto (dentro una riga di
bottoni che va a capo, non più fissa vicino al bordo destro come nella
top-bar di LiveAuctionMode) il popover `.syncpop` con `right:0` usciva dal
viewport su schermi stretti — cambiato a `left:50%;transform:translateX(-50%)`
+ `max-width:calc(100vw - 24px)`, verificato in browser che resta dentro lo
schermo.

## FATTO (27/08/2026): fix scroll orizzontale tabella quote Preset fasce
Screenshot di Luciano: su mobile la tabella "Quote F1–F4 per ruolo" nel
Preset fasce si vedeva tagliata su ENTRAMBI i lati (colonna Ruolo troncata
a sinistra, F1 troncata a destra) e non scrollava affatto col dito.

Causa reale: `.pcard` (contenitore di tutte le modali) aveva
`overflow:auto` (shorthand, quindi sia X che Y), e la tabella era avvolta
in un secondo contenitore con `overflow-x:auto` — due scroll orizzontali
annidati. Su touch il gesto orizzontale finiva ambiguo tra i due, in pratica
non scrollava mai in modo affidabile. Fix: `.pcard` ora è
`overflow-y:auto;overflow-x:hidden` esplicito — un solo contenitore
orizzontale possibile, quello della tabella. Aggiunta anche colonna
"Ruolo" `position:sticky` (stesso pattern già usato per la colonna nome
nella tabella principale) cosí il ruolo resta visibile mentre si scrolla
F1→F4, e un hint testuale sopra la tabella solo mobile ("Ruolo fisso,
scorri di lato per F1–F4 →"), stesso linguaggio dello scrollhint già
esistente sulla tabella grande. Verificato in browser: scroll orizzontale
funzionante, F4 raggiungibile, Ruolo resta fisso a sinistra.

## FATTO (27/08/2026): affordance "tappabile" sulle card strategia onboarding
Screenshot di Luciano da mobile: le 3 card strategia (step 1 onboarding) non
si leggevano come bottoni — bordo sottile uguale a un contenitore
informativo, nessun segnale di interattività a riposo. Su desktop il
`:hover` in parte compensava, su touch quello stato semplicemente non
esiste: prima del tap, zero differenza visiva da un box di solo testo.

Fix in `OnboardingModal.tsx`/`tool.css`: riga di istruzione esplicita sopra
la griglia ("👇 Tocca una scheda per scegliere e continuare"), più una CTA
"SCEGLI QUESTA →" in calce a ogni card (span `aria-hidden`, il nome
accessibile della card resta il testo reale — la freccia è rinforzo visivo,
non informazione nuova per chi usa screen reader). Aggiunto anche
`:active` (feedback al tap, mancava — c'erano solo `:hover`/`:focus-visible`)
e un leggero bordo/ombra a riposo (`.pickcard`) per far leggere il
contenitore come superficie cliccabile anche prima di toccarlo. Stesso
trattamento non esteso alle card Classic/Mantra dello step 2 (fuori scope):
lì c'è già un bottone "Continua" esplicito sotto, l'ambiguità è minore.

## FATTO (27/08/2026): mobile più compatto (budget collassabile + card reparto ridotte)
Richiesta dopo che Luciano ha trovato il bottone "Inizia asta" (era dietro
l'onboarding, non un bug) e ha notato che su mobile il pannello budget e le
5 card reparto occupano troppo spazio prima di arrivare alla tabella.

**Budget & allocazione**: ora un `<details className="strat editbudget-details">`
(stesso pattern già usato da "Promemoria strategia"/"Probabili formazioni"),
aperto di default su desktop, chiuso su mobile — "una volta impostato non
serve più tenerlo davanti". Il default open/closed è settato UNA VOLTA sola
via `useEffect`+ref al mount (`window.innerWidth>=700`), MAI come prop
`open` controllata da React: `BudgetPanel` si ri-renderizza a ogni acquisto
(cambia `state.st`), e se `open` fosse legato a uno state re-settato ogni
render, avrebbe richiuso il pannello sotto al dito appena l'utente lo apriva
a mano. Verificato in browser: resta chiuso dopo un click su una fascia
altrove nella pagina (re-render reale, non solo teoria).

**Card reparto** (Portieri/Difensori/Centrocampisti/Attaccanti/Totale): su
mobile (≤700px) via CSS spariscono la barra di progresso e i pallini slot
(gli elementi decorativi, non l'informazione — resta ruolo+numero+residuo),
padding/font ridotti. Invariate su desktop.

## FATTO (26/08/2026): PWA installabile + banner "nuova versione disponibile"
Innescato da un problema reale: Luciano vedeva una versione vecchia in prod
dopo un deploy — causa quasi certa, un tab rimasto aperto da prima (SPA che
non si ricarica da sola, non un bug di caching headers: verificato
`cache-control: public, max-age=0, must-revalidate` su Vercel, corretto).

**PWA**: `public/manifest.json` (start_url `/tool` — l'app installata apre
dritto il tool, non la landing marketing), icone generate al volo (nessun
asset esistente): pagina HTML con l'emoji ⚽ su sfondo gradiente
--acc→--acc2 (stesso stile del logo esistente in Header), screenshot via
browser + `sips` per il resize esatto a 192/512/180px (nessun tool di
rasterizzazione SVG disponibile in locale). Service worker
`public/sw.js` VOLUTAMENTE senza cache — solo `skipWaiting`/`clients.claim`/
passthrough fetch, presente solo per soddisfare i criteri di installabilità
di Chrome. Deciso esplicitamente con Luciano di NON fare caching offline
vero: un SW cache-first sarebbe stato il modo più diretto di REINTRODURRE
il bug di versione vecchia appena lamentato.

**Banner aggiornamento**: nuova route `/api/version` (legge
`VERCEL_GIT_COMMIT_SHA` a ogni richiesta, sempre fresca) confrontata da
`UpdateBanner.tsx` con `NEXT_PUBLIC_BUILD_SHA` — quest'ultima iniettata nel
bundle client al build time via `next.config.ts` (`env:` field, legge la
stessa `VERCEL_GIT_COMMIT_SHA` che Vercel imposta da sola a ogni deploy,
zero setup manuale). Check ogni 2 minuti + su `visibilitychange` (copre
il caso "tab lasciato aperto e ripreso dopo"). Se le due sha divergono:
banner fisso in basso "Nuova versione disponibile" + bottone Aggiorna →
`location.reload()`. In dev locale `NEXT_PUBLIC_BUILD_SHA` è vuota (nessuna
Vercel env), banner correttamente mai mostrato — testato iniettando il
banner via JS in console per verificarne lo stile senza dover simulare un
deploy reale.

## FATTO (26/08/2026): modalità "Inizia asta" mobile + sync multi-device
Pianificata con `$impeccable shape` (interview + brief confermato con
Luciano) prima di scrivere codice — prima volta che lo skill Impeccable
viene usato in questo progetto, creato `web/PRODUCT.md` (inferito dal
contesto già raccolto in sessione, non da un'intervista dedicata: progetto
maturo, non greenfield).

Nuovo bottone "🎙 Inizia asta" in `Header.tsx`, visibile SOLO sotto 700px
(classe `.live-enter`, stesso breakpoint già usato per `.tbtn`/`.scrollhint`)
— su desktop resta solo la tabella. Apre `LiveAuctionMode.tsx`: schermo
intero che sostituisce tutto il resto (`page.tsx` fa uno swap secco, non un
overlay), un giocatore alla volta — ricerca nome autofocus in cima, tap sul
risultato apre la scheda con FVM/Val/xG-xA, bottoni fascia grandi (48px vs
40px desktop), Tgt, e due bottoni enormi Io/Altri. Zero rischio di toccare
la riga sbagliata sotto pressione (motivo esplicito della richiesta di
Luciano). Riusa `useTracking()`/`computeBudgetSummary` esistenti, nessuna
nuova fonte di verità per i dati giocatore — bug trovato in verifica
browser: avevo riusato le classi CSS `.pgrid`/`.pbox` per i box statistiche,
ma sono scoped `.pcard .pgrid` (solo dentro le modali) — invisibili fuori
da lì. Rinominate in `.livestats`/`.livestatbox` con CSS dedicato.

**Sync multi-device** (richiesta di Luciano: poter lavorare da 2 device
sulla stessa asta, es. un familiare al telefono mentre lui è al laptop):
rompe deliberatamente il principio "solo client-side, nessun backend" che
il progetto ha sempre avuto — deciso esplicitamente con l'utente dopo aver
fatto presente il trade-off (3 opzioni proposte: polling con codice,
WebSocket realtime, export/import manuale — scelto polling, il più
semplice che copre il caso d'uso reale). Nuova route `web/app/api/sync/
route.ts` (GET/POST) parla con Upstash Redis via REST API pura (no SDK),
chiave `asta:{codice a 6 cifre}`, TTL 48h (non è storage permanente, solo
un ponte per l'asta del giorno). Lato client: `web/lib/sync.ts` (fetch
helpers) + logica di polling/push dentro `AstaContext.tsx` (non un context
separato: serve dispatch/state che l'AstaContext già possiede) — polling
ogni 4s, push debounced 800ms, `lastSyncedAtRef` confronta i timestamp per
non riapplicare dati vecchi né rimandare in loop uno stato appena ricevuto
(`suppressNextPushRef` blocca l'eco). Local-first per design: se
`UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` non sono configurate la
route risponde 503 pulito, il tool resta perfettamente funzionante solo
locale (verificato: nessun crash, fascia/Io/Altri/Tgt continuano a
funzionare, chip sync mostra "Errore sync" in rosso).

**Da fare lato Luciano prima che la sync funzioni in prod**: Vercel
Dashboard → progetto "web" → Storage → Create Database → Upstash for Redis
→ connetti al progetto (inietta le env var in automatico, nessun copia-
incolla di token in chat). Poi `vercel env pull` in locale se serve
testare, o semplicemente ridistribuire — Vercel inietta le var da solo nei
deploy successivi alla connessione.

## FATTO (24/08/2026): giro completo (6°) — giornata 1 giocata, listone 515
Prima asta-prep dopo il fischio d'inizio: giornata 1 di Serie A 2026/27
disputata proprio oggi (22-24/08). Verificato che FBref/Understat NON hanno
ancora dati fruibili per la nuova stagione (1 sola giornata su 38 — campione
troppo piccolo, un gol distorcerebbe tutto) — **stats resta su 2025/26/2024/25
come base**, si passerà a 2026/27 dopo 4-5 giornate (metà settembre circa).

Trasferimenti (153, era 150), infortuni (43/43, nuovo formato prosa confermato
stabile), formazioni tutte 6 fonti — bug ricorrente FantaMaster (Inter/Torino/
Venezia senza delimitatore "ALL." dopo l'XI, testo prosa si incolla al nome)
patchato a mano come nei giri precedenti. Non agganciati 36→14 dopo il refresh
quotazioni: la maggior parte erano proprio i nuovi acquisti appena aggiunti al
listone (Jones, Sutalo, Badiashile, Fortini — confermando che le fonti
formazioni erano più aggiornate del listone quotazioni, non un errore delle
fonti). Rigoristi: Venezia designato cambiato Adams→Busio (Gazzetta).

Quotazioni 508→515 (+11, -4, **105 aggiornati** — molto più del solito, FVM
ricalcolati con l'inizio stagione reale). Nuovo campo `web/data/meta.json`
aggiornato ad ogni giro (già previsto dal 21/08, solo il valore cambia).

**Cadenza**: da qui in avanti refresh ogni 2-3 giorni fino all'asta. Le fonti
formazioni/trasferimenti/infortuni NON richiedono login e potrebbero in
teoria essere automatizzate; le quotazioni restano bloccate da login
fantacalcio.it — l'utente deve scaricare l'xlsx a mano ad ogni giro, nessun
modo per bypassarlo trovato finora.

## FATTO (21/08/2026): alternative simili per giocatori presi da altri
Richiesta: quando un giocatore in fascia viene preso da un altro fantallenatore,
suggerire alternative simili (stesso ruolo, FVM e produzione attesa vicini) tra
i giocatori ancora liberi, per capire subito su chi ripiegare.

Nuovo `web/lib/similar.ts` (`findSimilarPlayers`): candidati = stesso ruolo,
status "free" (non "mine"/"out"). Punteggio di produzione = Val per i portieri
(non hanno xG/xA), xG+xA per gli altri ruoli. Distanza = |ΔFVM|/FVM_target +
|Δproduzione|/produzione_target (entrambe normalizzate sul giocatore di
riferimento per essere comparabili pur avendo scale diverse), ordinamento
crescente, primi 4. Nessun peso per fascia/tit — solo dati oggettivi, coerente
con lo stile "trasparente" già usato per Val/preset.

UI: `PlayerCardModal.tsx` mostra la sezione "🔄 Preso da altri — alternative
simili" SOLO quando lo stato del giocatore è "out" (richiede `st` da `useAsta()`,
prima non serviva). Ogni alternativa è cliccabile e riapre la scheda su quel
giocatore (nuova prop `onOpenCard` passata da `page.tsx`, stesso handler già
usato dalla tabella) — serve anche `allPlayers` (il `derived` di page.tsx) per
poter cercare tra tutti i giocatori, non solo quello aperto.

## FATTO (21/08/2026): giro completo (5°) + data ultimo aggiornamento nel tool
Quotazioni 501→508 (+13, -6, 3 aggiornati incl. Lucumì Bologna→Juventus —
confermava un dato che FantaMaster aveva già anticipato il 17/08 e che avevo
scambiato per un refuso della fonte, non lo era). Trasferimenti rifetchati
(150 agganciati, era 129) — Lucumì e Spence ancora non hanno badge 🆕, API-
Football non li ha ancora indicizzati nonostante siano già nel listone
ufficiale. Infortuni rifetchati col parser nuovo formato (33/33 agganciati,
era 27). Formazioni tutte e 6 le fonti rifatte (nuovi bug di formattazione
nei siti sorgente sistemati al volo: FantaMaster aveva `(4-3-3 ):` con
spazio prima della parentesi invece di `(4-3-3):`, rompeva l'header regex;
Torino aveva un ":" al posto di una "," come separatore giocatori) — 10
non agganciati su 1320 slot (~0.8%), giocatori non ancora nel listone
ufficiale o (Circati) già ceduto. Rigoristi: un cambio, Torino
Casadei→Oristanio come rigorista alternativo (Gazzetta).

**Nuovo**: data ultimo aggiornamento dati visibile nel tool. `web/data/
meta.json` (`{"aggiornato": "YYYY-MM-DD"}`), letto in `page.tsx` e
formattato in italiano (`toLocaleDateString("it-IT", ...)`), passato come
prop `updatedAt` a `Header.tsx` — mostrato nella riga sotto il titolo:
"Tool strategico · Classic · 10 squadre · budget 500 crediti · dati
aggiornati al 21 agosto 2026". Da aggiornare a mano (un solo campo) ad ogni
refresh dati, prima di propagare/buildare.

## FATTO (17/08/2026, 4° giro): refresh quotazioni + Spence risolve gap formazioni
Rilanciato `update_quotazioni.py` su xlsx fresco (498→501, +3: Pisseri P.
Frosinone, Radunovic Cagliari, Spence D. Inter — 0 aggiornati, 0 usciti).
Spence era l'unico non-aggancio "vero" del giro formazioni di poco fa (citato
da 5/6 fonti per l'Inter ma assente dal listone): rilanciato
`build_formazioni.py` subito dopo, non agganciati 12→6 (i 6 residui sono
refusi propri delle fonti — Ederson D.s. minuscolo, Lucumì attribuito a
Juventus invece che Bologna da FantaMaster, nomi tipo Fayed/Foe Ondoa/Perri/
Luongo non nel listone — non correggibili lato nostro).

## FATTO (17/08/2026): giro completo trasferimenti+infortuni+formazioni+rigoristi
Innescato da un check dell'utente: Frattesi passato Inter→Lazio nel listone
(16/08) ma Val=0 e nessun badge 🆕 — Val era corretto (0 gol/0 assist reali a
Inter 2025/26, non un bug), ma trasferimenti/formazioni erano fermi al giro
precedente. Rifatto tutto tranne stats (stagione 2025/26 chiusa, cache
invariata):

**Trasferimenti**: `get_transfers.py` rifetchato da zero (cache parziale
riusata dov'è sopravvissuta a un primo tentativo andato in timeout) + merge:
129 agganciati (era 128). Frattesi NON compare nei dati API-Football
nonostante il trasferimento sia già nel listone ufficiale — fonte esterna
non ancora aggiornata su questo specifico trasferimento, nessun badge 🆕 per
lui finché non arriva lì (non è un bug nostro).

**Infortuni**: fantacalcio.it ha cambiato formato pagina (da coppia
diagnosi/rientro esplicita a paragrafo narrativo unico per giocatore) —
parser riscritto ad-hoc (split per frase, poi fallback su virgola/congiunzione
con parola chiave di rientro) per ricavare `d`/`r` dal nuovo formato prosa.
27/27 agganciati puliti.

**Formazioni (tutte e 6 le fonti)**: SOS Fanta e FantaMaster estratti via
regex diretta su HTML (pattern "Formazione-tipo: ...", occhio a NON
strippare i punti finali delle iniziali tipo "Kristensen T." — bug trovato
e corretto, da 84 a 22 non agganciati). Eurosport e Goal via agent
(WebFetch bloccato/instabile su Eurosport, curl diretto ha funzionato per
Goal) — nessuna delle due fonti riporta ballottaggi espliciti (solo XI +
eventuale panchina generica), quindi contribuiscono 0 al conteggio `ball`.
Gazzetta e Fantacalcio.it via script esistenti invariati. 12 non agganciati
residui su 1320 slot totali (~1%): per lo più Spence (nuovo acquisto Inter,
non ancora nel listone ufficiale) + un paio di refusi propri delle fonti
(es. FantaMaster attribuisce erroneamente Lucumì alla Juventus). Frattesi
ora tit=4/6 su Lazio (prima 0 su Inter, dato stale).

**Rigoristi**: `align_pen.py` aggiornato con la nuova gerarchia Gazzetta —
un solo cambio reale, Parma: Pellegrino (ceduto alla Fiorentina, pen 1→0)
sostituito da Valeri (pen 0→2), Bernabè confermato designato (pen 2→1,
ordine invertito nell'articolo ma resta lui il rigorista principale).

**Stats**: nessun refresh (stagione 2025/26 chiusa). Verificato che i 4
nuovi giocatori del giro quotazioni (Obrador, Romero D., Penev, Terzic) non
hanno un aggancio FBref affidabile nel csv già scaricato (nomi ambigui o
squadra/ruolo non corrispondenti) — restano `stat:false` con badge 🎲,
meglio nessun dato che un aggancio sbagliato.

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
