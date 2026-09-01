"""Calcola la "griglia portieri": per ogni coppia di squadre, quante giornate
su 38 giocano ENTRAMBE in trasferta nella stessa giornata (calendario Serie A
2026/27 completo, incluse le giornate non ancora giocate — il calendario
stagionale è pubblicato per intero prima dell'inizio del campionato).

Idea: chi possiede due portieri di squadre diverse di solito parte con quello
che gioca in casa quella giornata (euristica standard fantacalcio). Il numero
"entrambe fuori casa" è quindi il numero di giornate in cui NESSUNO dei due
titolari avrebbe un'indicazione forte — un buon accoppiamento lo minimizza.
Le coppie stracittadine che condividono lo stadio (Inter/Milan, Roma/Lazio) o
per cui il calendario evita sistematicamente sovrapposizioni (Juventus/
Torino) risultano a 0: non è un errore, il calendario le alterna quasi
sempre casa/trasferta.

Fonte calendario: FBref via soccerdata (soccerdata.FBref.read_schedule),
stessa libreria già usata per le statistiche — vedi scripts/fetch_2627_stats.py
per l'ambiente virtuale.

Uso (con un venv che ha soccerdata+pandas installati):
    python3 scripts/build_gk_grid.py
Scrive gkgrid.json nella root del progetto. Da ricopiare in
web/data/gkgrid.json come gli altri dataset (players.json, formazioni.json).
Va ricalcolato solo se il calendario ufficiale cambia in modo strutturale
(non serve rifarlo ad ogni giornata giocata: il numero di giornate "entrambe
fuori" per l'intera stagione non dipende da quali giornate sono già state
disputate).
"""
import json
import os

import soccerdata as sd

PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    fb = sd.FBref(leagues="ITA-Serie A", seasons=["2627"])
    sch = fb.read_schedule().reset_index()

    teams = sorted(set(sch["home_team"]) | set(sch["away_team"]))
    away_weeks = {t: set() for t in teams}
    for _, r in sch.iterrows():
        away_weeks[r["away_team"]].add(int(r["week"]))

    n_weeks = int(sch["week"].nunique())
    grid = {a: {} for a in teams}
    for a in teams:
        for b in teams:
            if a == b:
                continue
            grid[a][b] = len(away_weeks[a] & away_weeks[b])

    out = {"teams": teams, "weeks": n_weeks, "grid": grid}
    json.dump(out, open(f"{PROJ}/gkgrid.json", "w"), ensure_ascii=False, indent=1)

    print(f"{len(teams)} squadre, {n_weeks} giornate")
    checks = [("Parma", "Sassuolo"), ("Atalanta", "Frosinone"), ("Inter", "Milan"),
              ("Roma", "Lazio"), ("Juventus", "Torino"), ("Sassuolo", "Genoa")]
    for a, b in checks:
        print(f"  {a}-{b}: {grid[a][b]}")
    print(f"\nScritto {PROJ}/gkgrid.json")


if __name__ == "__main__":
    main()
