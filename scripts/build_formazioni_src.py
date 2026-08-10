"""Assembla formazioni_src.json dalle 5 fonti: 4 fetch generalisti (embeddati in
_formazioni_sources_2608.py) + gazzetta_src.json (da scripts/fetch_gazzetta.py).

Uso: python3 scripts/build_formazioni_src.py
"""
import json

from _formazioni_sources_2608 import EUROSPORT, FANTAMASTER, GOAL, SOS_FANTA

GAZZETTA_PATH = "gazzetta_src.json"
OUT_PATH = "formazioni_src.json"


def main():
    gazzetta_raw = json.load(open(GAZZETTA_PATH))
    gazzetta = {
        team: {"mod": v["mod"], "xi": v["xi"], "ball": v["ball"]}
        for team, v in gazzetta_raw.items()
    }

    sources = [
        {"name": "SOS Fanta", "teams": SOS_FANTA},
        {"name": "FantaMaster", "teams": FANTAMASTER},
        {"name": "Eurosport", "teams": EUROSPORT},
        {"name": "Goal", "teams": GOAL},
        {"name": "Gazzetta", "teams": gazzetta},
    ]

    for s in sources:
        print(f"{s['name']}: {len(s['teams'])} squadre")

    json.dump({"sources": sources}, open(OUT_PATH, "w"), ensure_ascii=False, indent=1)
    print(f"\nScritto {OUT_PATH}")


if __name__ == "__main__":
    main()
