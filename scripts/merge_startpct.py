"""Aggancia sosfanta_percentuali.json (probabilità di titolarità per la
GIORNATA CORRENTE, 0-100) a players_pen.json come campo `startPct`.

Va rilanciato ogni settimana insieme a fetch_sosfanta_percentuali.py, prima
di ogni giornata — dato volatile per definizione (vedi note nello script di
fetch). Scrive anche web/data/giornata.json con periodo/data di refresh,
letto dalla UI per mostrare quanto è fresco il dato.

Uso: python3 scripts/fetch_sosfanta_percentuali.py
     python3 scripts/merge_startpct.py
"""
import datetime
import json
import re
import unicodedata

PROJ = "/Users/luciano.murruni/Projects/asta_fantacalcio"


def norm(s):
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.lower().replace("-", " ").replace("'", " ").strip()


def split_name(n):
    n = n.strip()
    m = re.search(r"\s+((?:[A-Z][a-z]{0,3}\.\s*)+)$", n)
    initials = []
    if m:
        initials = [norm(x) for x in re.findall(r"[A-Z][a-z]{0,3}(?=\.)", m.group(1))]
        n = n[: m.start()]
    return norm(n), initials


def lev1(a, b):
    if a == b:
        return True
    la, lb = len(a), len(b)
    if abs(la - lb) > 1:
        return False
    if la == lb:
        return sum(x != y for x, y in zip(a, b)) == 1
    if la > lb:
        a, b, la, lb = b, a, lb, la
    i = j = diff = 0
    while i < la and j < lb:
        if a[i] == b[j]:
            i += 1
            j += 1
        else:
            diff += 1
            if diff > 1:
                return False
            j += 1
    return True


def find(roster, raw):
    sur, initials = split_name(raw)
    cands, fuzzy = [], []
    for p in roster:
        psur, pini = split_name(p["n"])
        if psur == sur or psur.endswith(" " + sur) or sur.endswith(" " + psur):
            cands.append((p, pini))
        elif lev1(psur, sur):
            fuzzy.append((p, pini))
    if not cands:
        cands = fuzzy
    if len(cands) > 1 and initials:
        cands = [(p, pini) for p, pini in cands
                 if not pini or pini[0].startswith(initials[0]) or initials[0].startswith(pini[0])]
    if len(cands) == 1:
        return cands[0][0]
    return None


def main():
    players = json.load(open(f"{PROJ}/players_pen.json"))
    data = json.load(open(f"{PROJ}/sosfanta_percentuali.json"))

    by_team = {}
    for p in players:
        by_team.setdefault(p["s"], []).append(p)

    for p in players:
        p.pop("startPct", None)

    matched, unmatched = 0, []
    for m in data["matches"]:
        roster = by_team.get(m["home"], []) + by_team.get(m["away"], [])
        for entry in m["players"]:
            p = find(roster, entry["n"])
            if p:
                # se già assegnato (giocatore citato in piu' ballottaggi/sezioni),
                # tiene il valore piu' alto: la stima piu' ottimistica ma coerente
                # con quanto gia' visto nella stessa pagina.
                p["startPct"] = max(p.get("startPct") or 0, entry["pct"])
                matched += 1
            else:
                unmatched.append((m["home"], m["away"], entry["n"]))

    json.dump(players, open(f"{PROJ}/players_pen.json", "w"), ensure_ascii=False, indent=1)

    giornata = {
        "periodo": data.get("periodo"),
        "aggiornato": datetime.date.today().isoformat(),
    }
    json.dump(giornata, open(f"{PROJ}/web/data/giornata.json", "w"), ensure_ascii=False, indent=1)

    print(f"Agganciati: {matched}")
    print(f"Non agganciati ({len(unmatched)}):")
    for home, away, n in unmatched:
        print(f"  [{home}-{away}] '{n}'")


if __name__ == "__main__":
    main()
