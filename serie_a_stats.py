"""
Scarica da FBref (via soccerdata) le statistiche dei giocatori dei 5 grandi
campionati europei, ultime due stagioni. Serve a coprire sia i giocatori di
Serie A sia i nuovi arrivi presi da Premier, Liga, Bundesliga e Ligue 1.

USO (nel Terminale del tuo Mac):
    pip install soccerdata pandas
    python3 serie_a_stats.py

Produce:
    big5_stats_full.csv   -> da ripassare a Claude
E stampa l'elenco dei campionati che la tua installazione supporta.
"""
import soccerdata as sd
import pandas as pd

SEASONS = ["2425", "2526"]   # ultime due stagioni completate

# 1) Mostra cosa supporta la tua installazione (utile per aggiungere Serie B ecc.)
try:
    print("Campionati disponibili out-of-the-box:")
    for l in sd.FBref.available_leagues():
        print("   ", l)
    print()
except Exception as e:
    print("Non riesco a leggere available_leagues:", e, "\n")

# 2) Big 5 europei insieme (Serie A + Premier + Liga + Bundesliga + Ligue 1)
print("Scarico i Big 5 europei (la prima volta puo' metterci qualche minuto)...")
fb = sd.FBref(leagues="Big 5 European Leagues Combined", seasons=SEASONS)

# Statistiche standard: gol, assist, rigori (PK/PKatt), xG, npxG, minuti, presenze,
# piu' nazionalita', posizione ed eta' (servono per abbinare i nuovi arrivi)
std = fb.read_player_season_stats(stat_type="standard")

# Appiattisce le intestazioni a piu' livelli in nomi semplici
std.columns = ["_".join([str(c) for c in col if c]).strip("_")
               for col in std.columns.to_flat_index()]
df = std.reset_index()

df.to_csv("big5_stats_full.csv", index=False)
print(f"\nFatto: {len(df)} righe salvate in 'big5_stats_full.csv'")
print("Colonne disponibili:")
print(list(df.columns))

# --------------------------------------------------------------------------
# 3) OPZIONALE — campionati extra (Serie B neopromosse, Eredivisie, Portogallo...)
#    Molte installazioni NON li hanno di default: se danno errore, ignorali e
#    dimmi quali comparivano nell'elenco stampato sopra, li configuriamo insieme.
# --------------------------------------------------------------------------
EXTRA = ["ITA-Serie B", "NED-Eredivisie", "POR-Primeira Liga", "ENG-Championship"]
rows = []
for lg in EXTRA:
    try:
        x = sd.FBref(leagues=lg, seasons=SEASONS).read_player_season_stats("standard")
        x.columns = ["_".join([str(c) for c in col if c]).strip("_")
                     for col in x.columns.to_flat_index()]
        rows.append(x.reset_index())
        print(f"  OK: {lg}")
    except Exception as e:
        print(f"  saltato {lg}: {type(e).__name__}")
if rows:
    extra_df = pd.concat(rows, ignore_index=True)
    extra_df.to_csv("extra_leagues_full.csv", index=False)
    print(f"\nSalvato anche 'extra_leagues_full.csv' ({len(extra_df)} righe).")
