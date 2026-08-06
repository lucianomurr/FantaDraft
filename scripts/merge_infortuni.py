#!/usr/bin/env python3
"""Aggancia infortuni.json a players_pen.json (campo `inj` = {d, r} o assente).

Al refresh pre-asta: riaggiornare infortuni.json dalla pagina
fantacalcio.it/infortunati-serie-a e rilanciare questo script.
"""
import json, re, unicodedata

PROJ = "/Users/luciano.murruni/Projects/asta_fantacalcio"

def norm(s):
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.lower().replace("-", " ").replace("'", " ").strip()

def surname(n):
    return norm(re.sub(r"(\s+[A-Z][a-z]{0,3}\.)+$", "", n.strip()))

def main():
    players = json.load(open(f"{PROJ}/players_pen.json"))
    inj = json.load(open(f"{PROJ}/infortuni.json"))["infortunati"]

    for p in players:
        p.pop("inj", None)

    unmatched = []
    for it in inj:
        roster = [p for p in players if p["s"] == it["s"]]
        exact = [p for p in roster if p["n"] == it["n"]]
        cands = exact or [p for p in roster if surname(p["n"]) == norm(it["n"])
                          or surname(p["n"]) == surname(it["n"])]
        if len(cands) == 1:
            cands[0]["inj"] = {"d": it["d"], "r": it["r"]}
        else:
            unmatched.append((it["s"], it["n"], len(cands)))

    json.dump(players, open(f"{PROJ}/players_pen.json", "w"), ensure_ascii=False,
              separators=(",", ":"))
    n = sum(1 for p in players if p.get("inj"))
    print(f"infortunati agganciati: {n}/{len(inj)}")
    for s, nm, k in unmatched:
        print(f"  NON AGGANCIATO {s}: '{nm}' ({k} candidati)")

if __name__ == "__main__":
    main()
