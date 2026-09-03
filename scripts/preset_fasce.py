#!/usr/bin/env python3
"""Preset fasce: score = FVM * (0.55 + 0.15*tit) + bonus rigorista.
Quote per ruolo -> F1/F2/F3/F4. Poi:
- R: titolari (tit>=2) con FVM basso (prezzo 1-2 cr) non gia' in fascia
- X: FVM alto ma tit==0 (prezzo da titolare, posto da riserva)
Scrive `pt` in players_pen.json e stampa anteprima.
"""
import os
import json

PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
players = json.load(open(f"{PROJ}/players_pen.json"))

QUOTA = {  # per ruolo: quanti in F1, F2, F3, F4
    "P": (3, 4, 5, 0),
    "D": (5, 7, 8, 8),
    "C": (5, 7, 8, 8),
    "A": (4, 6, 8, 8),
}
R_MAXFVM = {"P": 15, "D": 6, "C": 6, "A": 10}  # soglia FVM per "riserva da 1cr"
X_MINFVM = {"P": 20, "D": 20, "C": 25, "A": 40}  # sopra questa cifra, tit==0 = trappola

NSRC = 5  # fonti formazioni

def score(p):
    s = p["f"] * (0.55 + 0.45 * p.get("tit", 0) / NSRC)
    if p["pen"] == 1: s += 12
    elif p["pen"] == 2: s += 4
    return s

for p in players:
    p.pop("pt", None)

by_role = {}
for p in players:
    by_role.setdefault(p["r"], []).append(p)

for r, pool in by_role.items():
    pool.sort(key=lambda p: -score(p))
    q1, q2, q3, q4 = QUOTA[r]
    i = 0
    for n, t in ((q1, "1"), (q2, "2"), (q3, "3"), (q4, "4")):
        for p in pool[i:i + n]:
            p["pt"] = t
        i += n
    for p in pool[i:]:
        if p.get("tit", 0) >= 3 and p["f"] <= R_MAXFVM[r]:
            p["pt"] = "R"
        elif p.get("tit", 0) == 0 and p["f"] >= X_MINFVM[r] and p["pen"] != 1:
            p["pt"] = "X"

json.dump(players, open(f"{PROJ}/players_pen.json", "w"), ensure_ascii=False,
          separators=(",", ":"))

for r in ("P", "D", "C", "A"):
    print(f"\n=== {r} ===")
    for t in ("1", "2", "3", "4", "R", "X"):
        names = [f"{p['n']} ({p['s']}, {p['f']})" for p in by_role[r] if p.get("pt") == t]
        if names:
            print(f" F{t}: " + " · ".join(names))
