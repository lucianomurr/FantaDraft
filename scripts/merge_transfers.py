"""
Aggancia transfers.json (API-Football, script get_transfers.py) a
players_pen.json. Aggiunge il campo `transfer` = {dir, date, from|to, type}
al giocatore quando:
- dir="in"  : è appena arrivato nella squadra in cui è già listato (conferma
              /data l'acquisto per chi ha il listone aggiornato)
- dir="out" : risulta ceduto/prestato da una squadra in cui il listone lo
              elenca ancora — segnale di possibile listone non aggiornato

USO (dalla root del progetto, dopo get_transfers.py):
    python3 scripts/merge_transfers.py
"""
import os
import json
import re
import unicodedata

PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def norm(s):
    if not isinstance(s, str):
        return ""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.lower().replace("-", " ").replace("'", " ").strip()

def fanta_surname(n):
    n = n.strip()
    n = re.sub(r"(\s+[A-Z][a-z]{0,3}\.)+$", "", n)
    return norm(n)

def api_surname(full_name):
    """API-Football spesso usa 'J. Stones' o nome completo: prende l'ultimo token."""
    toks = norm(full_name).split()
    return toks[-1] if toks else ""

def surnames_match(a, b):
    if a == b:
        return True
    return a.endswith(" " + b) or b.endswith(" " + a) or a.split()[-1:] == b.split()[-1:]

def main():
    players = json.load(open(f"{PROJ}/players_pen.json"))
    tr = json.load(open(f"{PROJ}/transfers.json"))
    events = tr["events"]

    for p in players:
        p.pop("transfer", None)

    by_team = {}
    for p in players:
        by_team.setdefault(p["s"], []).append(p)

    matched, unmatched = 0, []
    for e in events:
        roster = by_team.get(e["team"], [])
        api_sur = api_surname(e["player"])
        cands = [p for p in roster if surnames_match(fanta_surname(p["n"]), api_sur)]
        if len(cands) != 1:
            unmatched.append((e, len(cands)))
            continue
        p = cands[0]
        cur = p.get("transfer")
        if cur and cur["date"] >= e["date"]:
            continue  # tieni l'evento piu' recente se un giocatore ne ha piu' d'uno
        if e["dir"] == "in":
            p["transfer"] = {"dir": "in", "date": e["date"], "from": e["from"], "type": e["type"]}
        else:
            p["transfer"] = {"dir": "out", "date": e["date"], "to": e["to"], "type": e["type"]}
        matched += 1

    json.dump(players, open(f"{PROJ}/players_pen.json", "w"), ensure_ascii=False,
              separators=(",", ":"))

    ins = sum(1 for p in players if p.get("transfer", {}).get("dir") == "in")
    outs = sum(1 for p in players if p.get("transfer", {}).get("dir") == "out")
    print(f"agganciati {matched} eventi ({ins} arrivi confermati, {outs} cessioni da rivedere)")
    print(f"\nNON AGGANCIATI ({len(unmatched)}) — controllare a mano:")
    for e, n in unmatched:
        print(f"  [{e['dir']}] {e['team']}: '{e['player']}' {e['date']} ({n} candidati)")

if __name__ == "__main__":
    main()
