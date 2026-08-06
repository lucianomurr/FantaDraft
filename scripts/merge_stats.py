#!/usr/bin/env python3
"""Merge FBref big5 stats into players_pen.json — v2 matching.

Season: prefer 2526, fallback 2425. Serie A: team+surname; ambigui risolti con
iniziali fantacalcio ("Martinez L." -> Lautaro). Nuovi arrivi: cognome (suffisso)
+ iniziali cross-team; accettati solo se unici, riportati per revisione.
"""
import json, re, shutil, unicodedata
from collections import defaultdict
import pandas as pd

PROJ = "/Users/luciano.murruni/Projects/asta_fantacalcio"

TRANSLIT = str.maketrans({
    "ø": "o", "Ø": "O", "đ": "d", "Đ": "D", "ł": "l", "Ł": "L",
    "ß": "ss", "æ": "ae", "Æ": "Ae", "œ": "oe", "Œ": "Oe",
    "ı": "i", "İ": "I", "þ": "th", "Þ": "Th", "ð": "d", "Ð": "D",
})

# fantacalcio surname (normalizzato) -> surname da cercare su FBref
ALIAS = {
    "zambo anguissa": "anguissa",
    "floriani mussolini": "floriani",  # FBref: "Romano Floriani" (Cremonese 25/26)
}

# (nome fantacalcio, squadra) da NON agganciare: omonimo trovato ma persona diversa
EXCLUDE = set()  # con la Serie B nel pool il team-match risolve anche Pessina (Monza)

def norm(s):
    if not isinstance(s, str):
        return ""
    s = s.translate(TRANSLIT)
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.lower().replace("’", "'").strip()

def split_fanta(n):
    """'Martinez Jo.' -> ('martinez', ['jo']); 'Esposito F.P.' -> ('esposito', ['f','p']);
    'Traorè Hj.' -> ('traore', ['hj']); 'Milinkovic-Savic V.' -> ('milinkovic-savic', ['v'])."""
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
    """Return (start, end) of contiguous surname tokens in toks, or None."""
    m = len(sur)
    for i in range(len(toks) - m, -1, -1):  # prefer rightmost
        if toks[i:i + m] == sur:
            return (i, i + m)
    return None

def match_initials(remaining, initials):
    """remaining: name tokens minus surname. initials: list like ['jo'] or ['f','p']."""
    if not initials:
        return True
    if not remaining:
        return False
    # pairwise: i-th initial prefixes i-th remaining token
    pair = all(i < len(remaining) and remaining[i].startswith(ini)
               for i, ini in enumerate(initials) if i < len(remaining))
    pair = pair and remaining[0].startswith(initials[0])
    if pair:
        return True
    # compressed multi ('hj' = Hamed Junior): first letters concat
    first_letters = "".join(t[0] for t in remaining)
    joined = "".join(initials)
    return first_letters.startswith(joined)

def main():
    players = json.load(open(f"{PROJ}/players_pen.json"))
    df = pd.read_csv(f"{PROJ}/big5_stats_full.csv")
    df["league"] = df["league"].fillna("GER-Bundesliga")
    import os
    if os.path.exists(f"{PROJ}/serieb_stats_full.csv"):
        db = pd.read_csv(f"{PROJ}/serieb_stats_full.csv")
        db["league"] = db["league"].fillna("ITA-Serie B")
        df = pd.concat([df, db], ignore_index=True)
    df["season"] = df["season"].astype(str)
    num = ["Performance_Gls", "Performance_Ast", "Performance_PK", "Performance_PKatt",
           "Playing Time_Min", "Playing Time_MP", "Playing Time_Starts"]
    for c in num:
        df[c] = pd.to_numeric(df[c], errors="coerce").fillna(0)

    rows = df.to_dict("records")
    for r in rows:
        r["_toks"] = tokens(str(r["player"]))
        r["_team"] = norm(str(r["team"]))
    by_season = defaultdict(list)
    for r in rows:
        by_season[r["season"]].append(r)

    def persons(cands):
        g = defaultdict(list)
        for r in cands:
            g[(norm(str(r["player"])), str(r["born"]))].append(r)
        return g

    person_rows = defaultdict(list)
    for r in rows:
        person_rows[(norm(str(r["player"])), str(r["born"]))].append(r)

    def hist_of(matches):
        """Tutte le stagioni/tappe della persona, righe separate (no somma)."""
        key = (norm(str(matches[0]["player"])), str(matches[0]["born"]))
        out = []
        for r in sorted(person_rows[key], key=lambda x: (-int(x["season"]), x["league"])):
            out.append({"sea": r["season"], "lg": r["league"].replace("ITA-", "").replace("ENG-", "").replace("ESP-", "").replace("GER-", "").replace("FRA-", ""),
                        "tm": str(r["team"]),
                        "mp": int(r["Playing Time_MP"]), "st": int(r["Playing Time_Starts"]),
                        "min": int(r["Playing Time_Min"]), "gls": int(r["Performance_Gls"]),
                        "ast": int(r["Performance_Ast"]), "pk": int(r["Performance_PK"]),
                        "pka": int(r["Performance_PKatt"])})
        return out

    def pack(matches, season):
        g = sum(m["Performance_Gls"] for m in matches)
        a = sum(m["Performance_Ast"] for m in matches)
        pk = sum(m["Performance_PK"] for m in matches)
        pka = sum(m["Performance_PKatt"] for m in matches)
        mn = sum(m["Playing Time_Min"] for m in matches)
        mp = sum(m["Playing Time_MP"] for m in matches)
        stt = sum(m["Playing Time_Starts"] for m in matches)
        leagues = [m["league"] for m in matches]
        src = "ITA-Serie A" if "ITA-Serie A" in leagues else leagues[0]
        nat = str(matches[0]["nation"]) if not pd.isna(matches[0]["nation"]) else None
        try:
            born = int(float(matches[0]["born"]))
        except (ValueError, TypeError):
            born = None
        return {"gls": int(g), "ast": int(a), "pk": int(pk), "pkatt": int(pka),
                "xg": None, "min": int(mn), "mp": int(mp), "starts": int(stt),
                "sea": season, "src": src, "stat": True,
                "nat": nat, "born": born, "hist": hist_of(matches)}

    unmatched, dubious, cross = [], [], []

    for p in players:
        sur, initials = split_fanta(p["n"])
        sur = ALIAS.get(sur, sur)
        sur_t = sur.replace("-", " ").replace("'", " ").split()
        team = norm(p["s"])
        found = None
        skip = (p["n"].strip(), p["s"]) in EXCLUDE
        for season in ("2526", "2425") if not skip else ():
            pool = by_season[season]
            cands = []
            for r in pool:
                span = find_span(r["_toks"], sur_t)
                if span:
                    is_suffix = span[1] == len(r["_toks"])
                    cands.append((r, span, is_suffix))
            if not cands:
                continue

            def resolve(cset, use_initials):
                if not cset:
                    return None
                suf = [c for c in cset if c[2]]
                for subset in ([c for c in (suf or cset)],):
                    if use_initials:
                        subset = [c for c in subset
                                  if match_initials(c[0]["_toks"][:c[1][0]] + c[0]["_toks"][c[1][1]:], initials)]
                    pg = persons([c[0] for c in subset])
                    if len(pg) == 1:
                        return list(pg.values())[0]
                return None

            tc = [c for c in cands if c[0]["_team"] == team]
            got = resolve(tc, use_initials=False)
            if got is None and tc:
                got = resolve(tc, use_initials=True)
            if got:
                found = pack(got, season)
                break
            # cross-team (nuovo arrivo)
            got = resolve(cands, use_initials=True)
            if got:
                found = pack(got, season)
                cross.append((p, season, str(got[0]["player"]),
                              f"{got[0]['team']} {got[0]['league']}"))
                break
            names = sorted({f"{c[0]['player']} ({c[0]['team']})" for c in cands})
            if len(names) > 1:
                dubious.append((p, season, names))

        for k in ("gls", "ast", "pk", "pkatt", "xg", "min", "mp", "starts", "sea", "src", "stat", "nat", "born", "hist"):
            p.pop(k, None)
        if found:
            p.update(found)
        else:
            p["stat"] = False
            unmatched.append(p)

    shutil.copy(f"{PROJ}/players_pen.json", f"{PROJ}/players_pen.backup.json")
    json.dump(players, open(f"{PROJ}/players_pen.json", "w"), ensure_ascii=False,
              separators=(",", ":"))

    ok = sum(1 for p in players if p.get("stat"))
    import io, sys
    buf = io.StringIO()
    sys.stdout = buf
    print(f"matched {ok}/{len(players)}")
    print(f"\nCROSS-TEAM ACCEPTED ({len(cross)}) — da revisionare:")
    for p, season, name, where in cross:
        print(f"  {p['r']} {p['n']} ({p['s']}) -> {name} [{where}] s{season}")
    print(f"\nUNMATCHED ({len(unmatched)}):")
    for p in unmatched:
        print(f"  {p['r']} {p['n']} ({p['s']}) FVM {p['f']}")
    seen = set()
    print(f"\nDUBIOUS non risolti:")
    for p, season, names in dubious:
        if not p.get("stat") and p["id"] not in seen:
            seen.add(p["id"])
            print(f"  {p['r']} {p['n']} ({p['s']}) s{season}: {names[:6]}")
    sys.stdout = sys.__stdout__
    report = buf.getvalue()
    open(f"{PROJ}/stats_merge_report.txt", "w").write(report)
    print(report)

if __name__ == "__main__":
    main()
