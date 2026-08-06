"""
Scarica da Understat (via soccerdata) xG, xA, npxG, tiri e key passes per i
Big 5 campionati europei, ultime due stagioni. Understat NON copre la Serie B.

USO (dalla root del progetto):
    python3 scripts/get_understat.py

Produce (nella root del progetto):
    understat_full.csv

Poi: python3 scripts/merge_understat.py
"""
import os
import pandas as pd
import soccerdata as sd

PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEAGUES = ["ITA-Serie A", "ENG-Premier League", "ESP-La Liga", "GER-Bundesliga", "FRA-Ligue 1"]
SEASONS = ["2425", "2526"]

frames = []
for lg in LEAGUES:
    try:
        us = sd.Understat(leagues=lg, seasons=SEASONS)
        df = us.read_player_season_stats().reset_index()
        frames.append(df)
        print("OK", lg, len(df))
    except Exception as e:
        print("FAIL", lg, type(e).__name__, e)

out = pd.concat(frames, ignore_index=True)
out.to_csv(f"{PROJ}/understat_full.csv", index=False)
print(f"\nTotale: {len(out)} righe salvate in 'understat_full.csv'")
