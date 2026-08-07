"""
Scarica gli ultimi trasferimenti delle 20 squadre di Serie A 2026/27 da
API-Football (piano free: 100 richieste/giorno, ~10/minuto — endpoint
/transfers NON è vincolato alla restrizione stagionale del piano free,
a differenza di /teams, /players, /fixtures che sul free plan accettano solo
stagioni 2022-2024).

USO (dalla root del progetto):
    export API_FOOTBALL_KEY=xxxxx   # o mettila in web/.env.local come API_FOOTBALL
    python3 scripts/get_transfers.py

Produce (nella root del progetto):
    transfers_raw.json   — risposte grezze per squadra (cache, evita richieste ripetute)
    transfers.json        — trasferimenti filtrati alla finestra estiva 2026, con
                             direzione (in/out) rispetto alle 20 squadre tracciate

Poi: python3 scripts/merge_transfers.py
"""
import json
import os
import time
import urllib.request
import urllib.error

PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://v3.football.api-sports.io"

# ID squadra API-Football (stabili, non vincolati alla stagione) per le 20
# squadre di Serie A 2026/27 presenti in players_pen.json.
TEAM_IDS = {
    "Atalanta": 499, "Bologna": 500, "Cagliari": 490, "Como": 895,
    "Fiorentina": 502, "Frosinone": 512, "Genoa": 495, "Inter": 505,
    "Juventus": 496, "Lazio": 487, "Lecce": 867, "Milan": 489,
    "Monza": 1579, "Napoli": 492, "Parma": 523, "Roma": 497,
    "Sassuolo": 488, "Torino": 503, "Udinese": 494, "Venezia": 517,
}

# Finestra di mercato da coprire (estate 2026, verso l'asta di inizio settembre).
WINDOW_START = "2026-05-01"

def load_key():
    k = os.environ.get("API_FOOTBALL_KEY") or os.environ.get("API_FOOTBALL")
    if k:
        return k
    env_local = os.path.join(PROJ, "web", ".env.local")
    if os.path.exists(env_local):
        for line in open(env_local):
            if line.startswith("API_FOOTBALL=") or line.startswith("API_FOOTBALL_KEY="):
                v = line.strip().split("=", 1)[1]
                if v:
                    return v
    raise SystemExit("API_FOOTBALL_KEY non trovata: impostala come env var o in web/.env.local")

def fetch_team_transfers(key, team_id):
    req = urllib.request.Request(
        f"{BASE}/transfers?team={team_id}",
        headers={"x-apisports-key": key},
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)

def main():
    key = load_key()
    raw_path = os.path.join(PROJ, "transfers_raw.json")
    raw = json.load(open(raw_path)) if os.path.exists(raw_path) else {}

    for name, team_id in TEAM_IDS.items():
        if name in raw:
            print(f"  cache: {name}")
            continue
        print(f"  scarico: {name} (id {team_id})...")
        try:
            data = fetch_team_transfers(key, team_id)
        except urllib.error.HTTPError as e:
            print(f"    ERRORE {name}: {e}")
            continue
        if data.get("errors"):
            print(f"    ERRORE API {name}: {data['errors']}")
            continue
        raw[name] = data
        json.dump(raw, open(raw_path, "w"), ensure_ascii=False)
        time.sleep(7)  # ~8.5 richieste/min, sotto il limite free (~10/min)

    team_names = set(TEAM_IDS.keys())
    events = []
    for our_team, data in raw.items():
        for p in data.get("response", []):
            player_name = p.get("player", {}).get("name")
            for t in p.get("transfers", []):
                date = t.get("date")
                if not date or date < WINDOW_START:
                    continue
                teams = t.get("teams", {})
                in_obj, out_obj = teams.get("in") or {}, teams.get("out") or {}
                team_in, team_out = in_obj.get("name"), out_obj.get("name")
                ttype = t.get("type")
                # bug noto di API-Football: per gli svincolati, invece di
                # teams.in=null a volte compare {id:null, name:"<Cognome Nome>"}
                # cioe' il nome del giocatore stesso spacciato per una squadra.
                if in_obj.get("id") is None:
                    team_in = "Svincolato"
                if out_obj.get("id") is None:
                    team_out = "Svincolato"
                if team_in == our_team:
                    events.append({"team": our_team, "dir": "in", "date": date,
                                    "player": player_name, "from": team_out, "type": ttype})
                elif team_out == our_team:
                    events.append({"team": our_team, "dir": "out", "date": date,
                                    "player": player_name, "to": team_in, "type": ttype})

    # dedup (stesso player/data/squadra puo' comparire piu' volte nella risposta API)
    seen = set()
    uniq = []
    for e in events:
        key_e = (e["team"], e["dir"], e["date"], e["player"])
        if key_e in seen:
            continue
        seen.add(key_e)
        uniq.append(e)
    uniq.sort(key=lambda e: e["date"], reverse=True)

    out_path = os.path.join(PROJ, "transfers.json")
    json.dump({"window_start": WINDOW_START, "events": uniq}, open(out_path, "w"),
               ensure_ascii=False, indent=1)
    print(f"\nFatto: {len(uniq)} trasferimenti dal {WINDOW_START} salvati in transfers.json")

if __name__ == "__main__":
    main()
