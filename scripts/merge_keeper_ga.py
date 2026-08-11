"""Aggiunge gol subiti ai portieri in players_pen.json.

Dato individuale reale (tabella "Player Goalkeeping" FBref, Serie A 2025/26):
FBref blocca lo scraping automatico di questa pagina con CAPTCHA persistente
(sia /keepers/ che le pagine standings), quindi la tabella è stata copiata a
mano da Luciano dal proprio browser (verificata: le somme per squadra
coincidono esattamente coi gol subiti di squadra, es. Inter Sommer 30 +
Martinez 4 + Di Gennaro 1 = 35). 10/08/2026.

Per le 3 squadre promosse dalla Serie B (Frosinone, Monza, Venezia, non
presenti nella Serie A 2025/26) si usa il proxy di squadra prorata sui
minuti, unica stagione disponibile in un campionato coperto.

Uso: python3 scripts/merge_keeper_ga.py
"""
import json
import re
import unicodedata

PEN_PATH = "players_pen.json"

# Tabella "Player Goalkeeping" FBref, Serie A 2025/26 (Player, Squad, Min, GA).
# Solo le 17 squadre Serie A 2025/26 presenti anche nel roster 2026/27.
PLAYER_GA = [
    ("Justin Bijlow", "Genoa", 1395, 20),
    ("Jean Butez", "Como", 3420, 29),
    ("Elia Caprile", "Cagliari", 3420, 53),
    ("Marco Carnesecchi", "Atalanta", 3330, 35),
    ("Oliver Christensen", "Fiorentina", 86, 1),
    ("Nikita Contini", "Napoli", 11, 0),
    ("Edoardo Corvi", "Parma", 1530, 18),
    ("Raffaele Di Gennaro", "Inter", 10, 1),
    ("Michele Di Gregorio", "Juventus", 2655, 25),
    ("Wladimiro Falcone", "Lecce", 3420, 50),
    ("Alessio Furlanetto", "Lazio", 180, 3),
    ("David de Gea", "Fiorentina", 3330, 49),
    ("Franco Israel", "Torino", 810, 18),
    ("Nicola Leali", "Genoa", 1847, 28),
    ("Luca Lezzerini", "Fiorentina", 4, 0),
    ("Mike Maignan", "Milan", 3295, 35),
    ("Josep Martinez", "Inter", 450, 4),
    ("Alex Meret", "Napoli", 979, 12),
    ("Vanja Milinkovic-Savic", "Napoli", 2430, 24),
    ("Lorenzo Montipo", "Hellas Verona", 3150, 54),
    ("Edoardo Motta", "Lazio", 810, 10),
    ("Arijanet Muric", "Sassuolo", 2880, 43),
    ("Maduka Okoye", "Udinese", 2616, 37),
    ("Daniele Padelli", "Udinese", 180, 2),
    ("Alberto Paleari", "Torino", 2610, 45),
    ("Mattia Perin", "Juventus", 765, 9),
    ("Massimo Pessina", "Bologna", 353, 2),
    ("Ivan Provedel", "Lazio", 2430, 27),
    ("Federico Ravaglia", "Bologna", 1470, 29),
    ("Filippo Rinaldi", "Parma", 90, 0),
    ("Simone Scuffet", "Pisa", 630, 15),
    ("Marco Silvestri", "Cremonese", 360, 7),
    ("Lukasz Skorupski", "Bologna", 1592, 18),
    ("Daniele Sommariva", "Genoa", 176, 4),
    ("Yann Sommer", "Inter", 2960, 30),
    ("Marco Sportiello", "Atalanta", 90, 1),
    ("Zion Suzuki", "Parma", 1800, 28),
    ("Mile Svilar", "Roma", 3420, 31),
    ("Pietro Terracciano", "Milan", 125, 0),
    ("Stefano Turati", "Sassuolo", 532, 7),
    ("Gioele Zacchi", "Sassuolo", 8, 0),
]

# Squadre promosse dalla B: nessun dato individuale Serie A disponibile,
# fallback sul proxy di squadra (gol subiti B 2025/26, script precedente).
TEAM_GA_SERIEB_PROMOSSE = {
    "Frosinone": 34,
    "Monza": 32,
    "Venezia": 31,
}

FULL_SEASON_MIN = 3420


def norm(s):
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.lower().replace("-", " ").replace("'", " ").strip()


def surname_key(n):
    """Ultima parola del cognome normalizzato (dopo aver tolto un'eventuale
    iniziale finale tipo 'V.' usata dal listone per gli omonimi)."""
    n = re.sub(r"\s+[A-Z][a-z]{0,3}\.?$", "", n.strip())
    return norm(n).split()[-1]


def main():
    pen = json.load(open(PEN_PATH))

    by_surname = {}
    dupes = set()
    for full_name, squad, minutes, ga in PLAYER_GA:
        key = surname_key(full_name)
        if key in by_surname:
            dupes.add(key)
        by_surname[key] = (minutes, ga, squad)
    if dupes:
        print(f"ATTENZIONE cognomi ambigui in PLAYER_GA (ultima occorrenza usata): {dupes}")

    matched, unmatched, proxied = [], [], []

    for p in pen:
        if p["r"] != "P":
            continue
        key = surname_key(p["n"])
        if key in by_surname:
            minutes, ga, squad = by_surname[key]
            p["ga"] = ga
            p["gaTeam"] = None
            p["gaIndividual"] = True
            matched.append((p["n"], p["s"], squad, ga))
            continue
        team_ga = TEAM_GA_SERIEB_PROMOSSE.get(p["s"])
        if team_ga is None:
            unmatched.append((p["n"], p["s"]))
            p["ga"] = None
            p["gaTeam"] = None
            p["gaIndividual"] = False
            continue
        own_min = p.get("min") or 0
        p["ga"] = round(team_ga * own_min / FULL_SEASON_MIN, 1) if own_min else None
        p["gaTeam"] = team_ga
        p["gaIndividual"] = False
        proxied.append((p["n"], p["s"], p["ga"]))

    json.dump(pen, open(PEN_PATH, "w"), ensure_ascii=False, indent=1)

    print(f"Dato individuale reale: {len(matched)}")
    for n, s, squad_src, ga in matched:
        if norm(squad_src) != norm(s):
            print(f"  {n}: dato 2025/26 da {squad_src} (ora {s}) — trasferito, ga={ga}")
    print(f"Proxy squadra (promosse B): {len(proxied)}")
    if unmatched:
        print(f"Senza alcun dato ({len(unmatched)}):")
        for n, s in unmatched:
            print(f"  {n} ({s})")


if __name__ == "__main__":
    main()
