#!/usr/bin/env python3
"""Aggancia i dati Understat (xG, xA, npxG, tiri, key passes) a players_pen.json.

Prende la STESSA stagione già scelta per le stat FBref (`sea`), così xG e gol
sono coerenti; se assente prova l'altra. Aggiunge:
- `xg`, `xa`, `npxg` (1 decimale), `sh` (tiri), `kp` (key passes)
Matching: squadra+cognome (con iniziali fantacalcio), fallback cross-team univoco.
"""
import json, re, unicodedata
from collections import defaultdict
import pandas as pd

PROJ = "/Users/luciano.murruni/Projects/asta_fantacalcio"

TRANSLIT = str.maketrans({"ø": "o", "Ø": "O", "đ": "d", "Đ": "D", "ł": "l", "Ł": "L",
                          "ß": "ss", "æ": "ae", "ı": "i", "İ": "I"})

TEAM_MAP = {  # nome understat (norm) -> nome fantacalcio (norm)
    "ac milan": "milan",
    "verona": "hellas verona",
    "parma calcio 1913": "parma",
}

ALIAS = {"zambo anguissa": "zambo",      # Understat: "Franck Zambo"
         "floriani mussolini": "floriani",
         "n'dicka": "ndicka",            # Understat: "Evan Ndicka" senza apostrofo
         "delprato": "del prato"}        # Understat: "Enrico Del Prato"

def norm(s):
    if not isinstance(s, str):
        return ""
    s = s.translate(TRANSLIT)
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.lower().replace("’", "'").strip()

def split_fanta(n):
    n = n.strip()
    m = re.search(r"\s+((?:[A-Z][a-z]{0,3}\.\s*)+)$", n)
    initials = []
    if m:
        initials = [norm(x) for x in re.findall(r"[A-Z][a-z]{0,3}(?=\.)", m.group(1))]
        n = n[: m.start()]
    return norm(n), initials

def tokens(s):
    return norm(s).replace("-", " ").replace("'", " ").split()

def find_span(toks, sur):
    m = len(sur)
    for i in range(len(toks) - m, -1, -1):
        if toks[i:i + m] == sur:
            return (i, i + m)
    return None

def match_initials(remaining, initials):
    if not initials:
        return True
    if not remaining:
        return False
    if remaining[0].startswith(initials[0]):
        return True
    first_letters = "".join(t[0] for t in remaining)
    return first_letters.startswith("".join(initials))

def main():
    players = json.load(open(f"{PROJ}/players_pen.json"))
    df = pd.read_csv(f"{PROJ}/understat_full.csv")
    df["season"] = df["season"].astype(str)
    for c in ("xg", "xa", "np_xg"):
        df[c] = pd.to_numeric(df[c], errors="coerce").fillna(0.0)
    for c in ("shots", "key_passes", "minutes"):
        df[c] = pd.to_numeric(df[c], errors="coerce").fillna(0).astype(int)

    rows = df.to_dict("records")
    for r in rows:
        r["_toks"] = tokens(str(r["player"]))
        t = norm(str(r["team"]))
        r["_team"] = TEAM_MAP.get(t, t)
    by_season = defaultdict(list)
    for r in rows:
        by_season[r["season"]].append(r)

    def persons(cands):
        g = defaultdict(list)
        for r in cands:
            g[norm(str(r["player"]))].append(r)  # understat non dà born: chiave solo nome
        return g

    def pack(matches):
        return {"xg": round(sum(m["xg"] for m in matches), 1),
                "xa": round(sum(m["xa"] for m in matches), 1),
                "npxg": round(sum(m["np_xg"] for m in matches), 1),
                "sh": sum(m["shots"] for m in matches),
                "kp": sum(m["key_passes"] for m in matches)}

    n_match = 0
    unmatched_with_stat = []
    for p in players:
        for k in ("xg", "xa", "npxg", "sh", "kp"):
            p.pop(k, None)
        p["xg"] = None
        if not p.get("stat"):
            continue
        sur, initials = split_fanta(p["n"])
        sur = ALIAS.get(sur, sur)
        sur_t = sur.replace("-", " ").replace("'", " ").split()
        team = norm(p["s"])
        seasons = [p["sea"]] + [s for s in ("2526", "2425") if s != p["sea"]]
        found = None
        for season in seasons:
            pool = by_season[season]
            cands = []
            for r in pool:
                span = find_span(r["_toks"], sur_t)
                if span:
                    cands.append((r, span, span[1] == len(r["_toks"])))
            if not cands:
                continue

            def resolve(cset, use_ini):
                if not cset:
                    return None
                suf = [c for c in cset if c[2]] or cset
                if use_ini:
                    suf = [c for c in suf
                           if match_initials(c[0]["_toks"][:c[1][0]] + c[0]["_toks"][c[1][1]:], initials)]
                pg = persons([c[0] for c in suf])
                if len(pg) == 1:
                    return list(pg.values())[0]
                return None

            tc = [c for c in cands if c[0]["_team"] == team]
            got = resolve(tc, False) or (resolve(tc, True) if tc else None) or resolve(cands, True)
            if got:
                found = pack(got)
                break
        if found:
            p.update(found)
            n_match += 1
        else:
            unmatched_with_stat.append(p)

    json.dump(players, open(f"{PROJ}/players_pen.json", "w"), ensure_ascii=False,
              separators=(",", ":"))
    tot_stat = sum(1 for p in players if p.get("stat"))
    print(f"understat agganciato: {n_match}/{tot_stat} (giocatori con stat FBref)")
    print(f"senza understat ({len(unmatched_with_stat)}):")
    for p in unmatched_with_stat:
        print(f"  {p['r']} {p['n']} ({p['s']}) src {p.get('src')} FVM {p['f']}")

if __name__ == "__main__":
    main()
