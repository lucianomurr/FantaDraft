"""Aggancia le probabilità di titolarità per la GIORNATA CORRENTE a
players_pen.json come campo `startPct` (0-100), incrociando le fonti
disponibili — oggi SOS Fanta e Gazzetta, entrambe con lo stesso formato
{"matches": [{home, away, players: [{n, pct, riv}]}]} (`riv` = nome del
rivale in ballottaggio, se presente). Quando un giocatore è agganciato da
più fonti il valore finale di `startPct` è la media (arrotondata); se una
sola fonte lo copre si usa quella. `ballotRival` (id del rivale) prende la
prima fonte che lo indica, non ha senso mediarlo.

Va rilanciato ogni settimana insieme agli script di fetch, prima di ogni
giornata — dato volatile per definizione. Scrive anche web/data/giornata.json
con periodo/data di refresh, letto dalla UI per mostrare quanto è fresco.

Uso: python3 scripts/fetch_sosfanta_percentuali.py
     python3 scripts/fetch_gazzetta_percentuali.py
     python3 scripts/merge_startpct.py
"""
import datetime
import json
import os
import re
import unicodedata

PROJ = "/Users/luciano.murruni/Projects/asta_fantacalcio"

# Gazzetta a volte usa solo il nome di battesimo per i giocatori più noti
# così (stesso caso già gestito in build_formazioni.py per le altre fonti).
ALIAS = {"lautaro": "Martinez L."}

SOURCES = [
    ("SOS Fanta", "sosfanta_percentuali.json"),
    ("Gazzetta", "gazzetta_percentuali.json"),
]


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
    want = ALIAS.get(norm(raw))
    if want:
        cands = [p for p in roster if p["n"] == want]
        if len(cands) == 1:
            return cands[0]
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


def match_source(data, by_team):
    """id -> pct e id -> id_rivale (se in ballottaggio) per una fonte,
    matching scopato alle 2 squadre del match."""
    out, riv_out, unmatched = {}, {}, []
    for m in data["matches"]:
        roster = by_team.get(m["home"], []) + by_team.get(m["away"], [])
        for entry in m["players"]:
            p = find(roster, entry["n"])
            if not p:
                unmatched.append((m["home"], m["away"], entry["n"]))
                continue
            out[p["id"]] = max(out.get(p["id"], 0), entry["pct"])
            riv_raw = entry.get("riv")
            if riv_raw and p["id"] not in riv_out:
                rp = find(roster, riv_raw)
                if rp:
                    riv_out[p["id"]] = rp["id"]
    return out, riv_out, unmatched


def main():
    players = json.load(open(f"{PROJ}/players_pen.json"))
    by_team = {}
    for p in players:
        by_team.setdefault(p["s"], []).append(p)

    for p in players:
        p.pop("startPct", None)
        p.pop("ballotRival", None)

    periodo = None
    per_source = {}
    per_source_riv = {}
    for name, fname in SOURCES:
        path = f"{PROJ}/{fname}"
        if not os.path.exists(path):
            print(f"({name}: {fname} non trovato, salto)")
            continue
        data = json.load(open(path))
        periodo = periodo or data.get("periodo")
        matched, riv, unmatched = match_source(data, by_team)
        per_source[name] = matched
        per_source_riv[name] = riv
        print(f"{name}: {len(matched)} agganciati, {len(unmatched)} non agganciati")
        for home, away, n in unmatched:
            print(f"  [{home}-{away}] '{n}'")

    all_ids = set()
    for m in per_source.values():
        all_ids |= m.keys()

    riv_by_id = {}
    for riv in per_source_riv.values():
        for pid, rid in riv.items():
            riv_by_id.setdefault(pid, rid)

    for p in players:
        if p["id"] not in all_ids:
            continue
        vals = [m[p["id"]] for m in per_source.values() if p["id"] in m]
        p["startPct"] = round(sum(vals) / len(vals))
        if p["id"] in riv_by_id:
            p["ballotRival"] = riv_by_id[p["id"]]

    # Avversario della giornata corrente per squadra (chi gioca contro chi,
    # in casa o fuori) — usato dalla Formazione consigliata per il fattore
    # avversario. Basta una fonte, i 10 match sono gli stessi per tutte.
    matchups = {}
    first_data = None
    for _, fname in SOURCES:
        path = f"{PROJ}/{fname}"
        if os.path.exists(path):
            first_data = json.load(open(path))
            break
    if first_data:
        for m in first_data["matches"]:
            matchups[m["home"]] = {"opp": m["away"], "home": True}
            matchups[m["away"]] = {"opp": m["home"], "home": False}
        json.dump(matchups, open(f"{PROJ}/web/data/matchups.json", "w"), ensure_ascii=False, indent=1)
        print(f"\nAvversari giornata corrente: {len(matchups)} squadre")

    json.dump(players, open(f"{PROJ}/players_pen.json", "w"), ensure_ascii=False, indent=1)

    giornata = {
        "periodo": periodo,
        "aggiornato": datetime.date.today().isoformat(),
        "fonti": list(per_source.keys()),
    }
    json.dump(giornata, open(f"{PROJ}/web/data/giornata.json", "w"), ensure_ascii=False, indent=1)

    print(f"\nTotale giocatori con startPct: {len(all_ids)}")


if __name__ == "__main__":
    main()
