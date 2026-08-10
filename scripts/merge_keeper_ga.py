"""Aggiunge gol subiti (proxy di squadra, prorata per minuti) ai portieri in
players_pen.json. Dato individuale per portiere non disponibile (FBref blocca
lo scraping della pagina keepers con CAPTCHA persistente) — si usa il totale
gol subiti dalla squadra nella stagione 2025/26 come proxy, scalato sui minuti
giocati dal portiere (base 3420 min = stagione piena da titolare).

Fonte: Wikipedia, tabelle finali 2025-26 Serie A e Serie B (verificate
sull'HTML grezzo, non sul riassunto AI), 10/08/2026. Le 3 squadre promosse per
il 2026/27 (Frosinone, Monza, Venezia) usano il dato Serie B 2025/26 (unica
stagione disponibile in massima serie... cioè in B, non A).

Uso: python3 scripts/merge_keeper_ga.py
"""
import json

PEN_PATH = "players_pen.json"

# Gol subiti stagione 2025/26 (fonte: Wikipedia, tabella finale)
TEAM_GA_2526 = {
    # Serie A 2025/26 (rimaste in A per il 26/27)
    "Atalanta": 36,
    "Bologna": 46,
    "Cagliari": 53,
    "Como": 29,
    "Fiorentina": 50,
    "Genoa": 51,
    "Inter": 35,
    "Juventus": 34,
    "Lazio": 40,
    "Lecce": 50,
    "Milan": 35,
    "Napoli": 36,
    "Parma": 46,
    "Roma": 31,
    "Sassuolo": 50,
    "Torino": 63,
    "Udinese": 48,
    # Serie B 2025/26 (promosse in A per il 26/27)
    "Frosinone": 34,
    "Monza": 32,
    "Venezia": 31,
}

FULL_SEASON_MIN = 3420  # 38 partite * 90 min


def main():
    pen = json.load(open(PEN_PATH))
    updated, missing_team = [], []

    for p in pen:
        if p["r"] != "P":
            continue
        team_ga = TEAM_GA_2526.get(p["s"])
        if team_ga is None:
            missing_team.append((p["n"], p["s"]))
            p["ga"] = None
            p["gaTeam"] = None
            continue
        minutes = p.get("min") or 0
        ga = round(team_ga * minutes / FULL_SEASON_MIN, 1) if minutes else None
        p["ga"] = ga
        p["gaTeam"] = team_ga
        updated.append((p["n"], p["s"], minutes, ga))

    json.dump(pen, open(PEN_PATH, "w"), ensure_ascii=False, indent=1)

    print(f"Portieri aggiornati: {len(updated)}")
    if missing_team:
        print(f"Squadre senza dato GA ({len(missing_team)}):")
        for n, s in missing_team:
            print(f"  {n} ({s})")


if __name__ == "__main__":
    main()
