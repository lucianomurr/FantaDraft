"""Confronta infortuni.json (fonte primaria fantacalcio.it, appena riscritto
da fetch_infortuni.py) con gazzetta_infortuni_raw.json (fetch_gazzetta_infortuni.py)
e aggiunge SOLO i nomi che Gazzetta segna indisponibili e che fantacalcio.it
non ha ancora — mai il contrario: l'assenza in una fonte non è prova di
rientro, non si rimuove mai nessuno automaticamente (stessa policy applicata
a mano nel refresh del 03/09/2026, vedi CLAUDE.md).

Uso (dopo fetch_infortuni.py e fetch_gazzetta_infortuni.py):
    python3 scripts/cross_check_infortuni.py
Poi: python3 scripts/merge_infortuni.py
"""
import json
import os
import re
import unicodedata

PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def norm(s):
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.lower().replace("-", " ").replace("'", " ")
    return re.sub(r"\s+", "", s).strip()


def surname(n):
    return norm(re.sub(r"(\s+[A-Z][a-z]{0,3}\.)+$", "", n.strip()))


def main():
    inf_path = f"{PROJ}/infortuni.json"
    gaz_path = f"{PROJ}/gazzetta_infortuni_raw.json"

    if not os.path.exists(inf_path) or not os.path.exists(gaz_path):
        print("infortuni.json o gazzetta_infortuni_raw.json mancante — salto il controllo incrociato.")
        return

    data = json.load(open(inf_path))
    cur = data["infortunati"]
    gaz = json.load(open(gaz_path))

    cur_by_team = {}
    for it in cur:
        cur_by_team.setdefault(it["s"], []).append(surname(it["n"]))

    added = []
    for team, players in gaz.items():
        known = cur_by_team.get(team, [])
        for p in players:
            gsur = surname(p["n"])
            if not gsur:
                continue
            found = any(gsur == k or (len(gsur) >= 4 and gsur in k) or (len(k) >= 4 and k in gsur) for k in known)
            if found:
                continue
            stato = p.get("stato", "")
            if "rientro" in stato.lower():
                m = re.search(r"(\d+)", stato)
                giornata = m.group(1) if m else "?"
                r = f"Punta a rientrare per la giornata {giornata} (fonte Gazzetta)."
            else:
                r = "Condizioni da valutare (fonte Gazzetta)."
            entry = {
                "s": team,
                "n": p["n"],
                "d": "Assente per un problema fisico, dettagli non ancora chiari.",
                "r": r,
            }
            cur.append(entry)
            added.append((team, p["n"]))

    if added:
        json.dump(data, open(inf_path, "w"), ensure_ascii=False, indent=1)

    print(f"Controllo incrociato Gazzetta: {len(added)} nuovi indisponibili aggiunti")
    for team, name in added:
        print(f"  [{team}] {name}")


if __name__ == "__main__":
    main()
