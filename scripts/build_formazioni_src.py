"""Aggiunge/aggiorna la fonte Fantacalcio.it in formazioni_src.json (le altre 5
fonti restano quelle già presenti nel file — questo script NON le rifà da zero,
serve scripts/fetch_gazzetta.py + il fetch manuale delle altre 4 per quello).

Uso: python3 scripts/fetch_fantacalcio_formazioni.py
     python3 scripts/build_formazioni_src.py
"""
import json

FFC_PATH = "fantacalcio_it_src.json"
OUT_PATH = "formazioni_src.json"


def main():
    out = json.load(open(OUT_PATH))
    ffc_teams = json.load(open(FFC_PATH))

    sources = [s for s in out["sources"] if s["name"] != "Fantacalcio.it"]
    sources.append({"name": "Fantacalcio.it", "teams": ffc_teams})
    out["sources"] = sources

    for s in out["sources"]:
        print(f"{s['name']}: {len(s['teams'])} squadre")

    json.dump(out, open(OUT_PATH, "w"), ensure_ascii=False, indent=1)
    print(f"\nScritto {OUT_PATH}")


if __name__ == "__main__":
    main()
