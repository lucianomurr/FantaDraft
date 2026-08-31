"""
Scarica da FBref (via soccerdata) le statistiche 2026/27 (stagione in corso,
poche giornate) e le APPENDE a big5_stats_full.csv / serieb_stats_full.csv
(non le sostituisce: 2425/2526 restano invariate).

Uso volutamente distinto da serie_a_stats.py: qui la stagione nuova va SOLO
ad arricchire lo storico (`hist` nella scheda giocatore), NON a diventare
la stagione primaria per gol/assist/xG/Val — con 1-2 giornate il campione è
troppo piccolo (un gol da 1 partita distorcerebbe tutto). merge_stats.py
resta invariato (preferenza 2526 poi 2425 per i campi primari): la riga
2627 comparirà comunque nello storico perché hist_of() prende TUTTE le
stagioni della persona nel csv, non solo quella scelta come primaria.

USO (dalla root del progetto):
    python3 scripts/fetch_2627_stats.py
Poi: python3 scripts/merge_stats.py (invariato)
"""
import os
import pandas as pd
import soccerdata as sd

PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEASON = ["2627"]


def fetch_standard(leagues):
    fb = sd.FBref(leagues=leagues, seasons=SEASON)
    std = fb.read_player_season_stats(stat_type="standard")
    std.columns = ["_".join([str(c) for c in col if c]).strip("_")
                   for col in std.columns.to_flat_index()]
    return std.reset_index()


def append(csv_path, new_df):
    if os.path.exists(csv_path):
        old = pd.read_csv(csv_path)
        old = old[old["season"].astype(str) != "2627"]  # rilancio idempotente
        combined = pd.concat([old, new_df], ignore_index=True)
    else:
        combined = new_df
    combined.to_csv(csv_path, index=False)


def main():
    print("Scarico Big 5 2026/27 (poche giornate, normale se alcuni giocatori mancano)...")
    df = fetch_standard("Big 5 European Leagues Combined")
    print(f"  {len(df)} righe")
    append(f"{PROJ}/big5_stats_full.csv", df)

    print("Scarico Serie B 2026/27...")
    try:
        dfb = fetch_standard("ITA-Serie B")
        print(f"  {len(dfb)} righe")
        append(f"{PROJ}/serieb_stats_full.csv", dfb)
    except Exception as e:
        print(f"  Serie B fallita (non bloccante): {e}")

    print("\nFatto. Rilancia scripts/merge_stats.py per aggiornare hist nella scheda giocatore.")


if __name__ == "__main__":
    main()
