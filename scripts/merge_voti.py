"""Aggancia voti.json (scripts/fetch_voti.py) a players_pen.json: campo
`voti` = [{g, v, fv}, ...] per giornata, ordinato — puro storico, non tocca
Val/fasce/preset (scelta esplicita di Luciano, 04/09/2026).

Uso: python3 scripts/merge_voti.py
"""
import json
import os

PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    players = json.load(open(f"{PROJ}/players_pen.json"))
    voti = json.load(open(f"{PROJ}/voti.json"))

    by_id = {p["id"]: p for p in players}
    n_players = 0
    n_entries = 0
    for g_str, entries in sorted(voti.items(), key=lambda kv: int(kv[0])):
        g = int(g_str)
        for pid_str, d in entries.items():
            pid = int(pid_str)
            p = by_id.get(pid)
            if not p:
                continue
            lst = [e for e in p.get("voti", []) if e["g"] != g]
            lst.append({"g": g, "v": d["v"], "fv": d["fv"]})
            lst.sort(key=lambda e: e["g"])
            p["voti"] = lst
            n_entries += 1

    n_players = sum(1 for p in players if p.get("voti"))
    json.dump(players, open(f"{PROJ}/players_pen.json", "w"), ensure_ascii=False, indent=1)
    print(f"voti agganciati: {n_entries} voti-giornata su {n_players} giocatori")


if __name__ == "__main__":
    main()
