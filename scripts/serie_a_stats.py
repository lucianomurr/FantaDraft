"""
Scarica da FBref (via soccerdata) le statistiche dei giocatori: Big 5 campionati
europei + Serie A italiana + Serie B italiana, ultime due stagioni. Copre sia i
giocatori già in Serie A sia i nuovi arrivi da estero sia i neopromossi dalla B.

USO (dalla root del progetto):
    pip install soccerdata pandas
    python3 scripts/serie_a_stats.py

Produce (nella root del progetto, non nella cartella scripts):
    big5_stats_full.csv    Big 5 campionati europei (standard: gol, assist, rigori, minuti)
    serieb_stats_full.csv  Serie B italiana (stesse colonne)

NOTA Serie B: FBref la chiama "Serie B (M)" nel suo indice, non "ITA-Serie B" come nel
resto di soccerdata — va aggiunta a mano in ~/soccerdata/config/league_dict.json:
    {"ITA-Serie B": {"FBref": "Serie B (M)", "season_start": "Aug", "season_end": "May"}}
Questo script scrive quel file automaticamente se non esiste già.

Dopo questo script: scripts/get_understat.py per xG/xA, poi merge_stats.py,
merge_understat.py, merge_infortuni.py, align_pen.py, build_formazioni.py,
preset_fasce.py (vedi fonti_formazioni.md per l'ordine completo).
"""
import json
import os
import soccerdata as sd
import pandas as pd

PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEASONS = ["2425", "2526"]  # ultime due stagioni

# Serie B non è nella config di default di soccerdata: la aggiungiamo se manca.
league_dict_path = os.path.expanduser("~/soccerdata/config/league_dict.json")
os.makedirs(os.path.dirname(league_dict_path), exist_ok=True)
existing = {}
if os.path.exists(league_dict_path):
    try:
        existing = json.load(open(league_dict_path))
    except Exception:
        existing = {}
if "ITA-Serie B" not in existing:
    existing["ITA-Serie B"] = {"FBref": "Serie B (M)", "season_start": "Aug", "season_end": "May"}
    json.dump(existing, open(league_dict_path, "w"), indent=2)
    print(f"Aggiunta Serie B a {league_dict_path}")

print("Scarico i Big 5 europei (la prima volta puo' metterci qualche minuto)...")
fb = sd.FBref(leagues="Big 5 European Leagues Combined", seasons=SEASONS)
std = fb.read_player_season_stats(stat_type="standard")
std.columns = ["_".join([str(c) for c in col if c]).strip("_")
               for col in std.columns.to_flat_index()]
df = std.reset_index()
df.to_csv(f"{PROJ}/big5_stats_full.csv", index=False)
print(f"Fatto: {len(df)} righe salvate in 'big5_stats_full.csv'")

print("\nScarico la Serie B italiana...")
try:
    sb = sd.FBref(leagues="ITA-Serie B", seasons=SEASONS)
    sbdf = sb.read_player_season_stats(stat_type="standard")
    sbdf.columns = ["_".join([str(c) for c in col if c]).strip("_")
                     for col in sbdf.columns.to_flat_index()]
    sbdf = sbdf.reset_index()
    sbdf.to_csv(f"{PROJ}/serieb_stats_full.csv", index=False)
    print(f"Fatto: {len(sbdf)} righe salvate in 'serieb_stats_full.csv'")
except Exception as e:
    print(f"Serie B saltata ({type(e).__name__}: {e}) — riprova o controlla league_dict.json")
