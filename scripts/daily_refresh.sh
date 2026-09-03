#!/bin/bash
# Refresh giornaliero: percentuali di titolarità (SOS Fanta + Gazzetta) e
# infortunati (fantacalcio.it + controllo incrociato Gazzetta), pubblicato
# in produzione solo se cambia qualcosa di reale. Pensato per launchd
# (vedi scripts/com.fantadraft.dailyrefresh.plist), nessuna dipendenza da
# Claude/AI — solo script deterministici, girano anche a mano.
#
# Uso: scripts/daily_refresh.sh
set -uo pipefail

PROJ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJ" || exit 1

LOG_DIR="$PROJ/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/daily_refresh_$(date +%Y-%m-%d_%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "=== Daily refresh: $(date '+%Y-%m-%d %H:%M:%S') ==="

PY=python3
GIT=git

echo "--- git pull ---"
$GIT pull origin main || { echo "ERRORE: git pull fallito, interrompo."; exit 1; }

echo "--- percentuali titolarità ---"
$PY scripts/fetch_sosfanta_percentuali.py || echo "ATTENZIONE: fetch SOS Fanta fallito, proseguo con l'altra fonte."
$PY scripts/fetch_gazzetta_percentuali.py || echo "ATTENZIONE: fetch Gazzetta fallito, proseguo con l'altra fonte."
$PY scripts/merge_startpct.py || echo "ATTENZIONE: merge_startpct fallito."

echo "--- infortunati ---"
$PY scripts/fetch_infortuni.py || echo "ATTENZIONE: fetch infortuni fallito, infortuni.json resta quello di prima."
$PY scripts/fetch_gazzetta_infortuni.py || echo "ATTENZIONE: fetch Gazzetta infortuni fallito, salto il controllo incrociato."
$PY scripts/cross_check_infortuni.py || echo "ATTENZIONE: controllo incrociato infortuni fallito."
$PY scripts/merge_infortuni.py || echo "ATTENZIONE: merge_infortuni fallito."

echo "--- propagazione ---"
cp players_pen.json web/data/players.json

echo "--- controllo modifiche ---"
CHANGED=$($GIT status --short -- players_pen.json infortuni.json web/data/ sosfanta_percentuali.json gazzetta_percentuali.json gazzetta_infortuni_raw.json 2>/dev/null)

if [ -z "$CHANGED" ]; then
  echo "Nessuna modifica reale, nulla da pubblicare."
  exit 0
fi

echo "Modifiche trovate:"
echo "$CHANGED"

$GIT add players_pen.json infortuni.json web/data/players.json web/data/giornata.json web/data/matchups.json \
  sosfanta_percentuali.json gazzetta_percentuali.json gazzetta_infortuni_raw.json 2>/dev/null

N_STARTPCT=$($PY -c "import json; d=json.load(open('players_pen.json')); print(sum(1 for p in d if p.get('startPct') is not None))")
N_INJ=$($PY -c "import json; print(len(json.load(open('infortuni.json'))['infortunati']))")

$GIT commit -m "Refresh automatico: titolarità e infortuni ($(date +%Y-%m-%d))

$N_STARTPCT giocatori con startPct, $N_INJ infortunati monitorati.
Eseguito da scripts/daily_refresh.sh via launchd, nessun intervento manuale." || {
  echo "ERRORE: git commit fallito."; exit 1;
}

$GIT push origin main || { echo "ERRORE: git push fallito — le modifiche restano solo in locale, non pubblicate."; exit 1; }

echo "Pubblicato. Il deploy Vercel partirà da solo (progetto collegato via GitHub)."
echo "=== Fine: $(date '+%Y-%m-%d %H:%M:%S') ==="
