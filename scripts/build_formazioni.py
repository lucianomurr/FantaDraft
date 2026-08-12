#!/usr/bin/env python3
"""Aggancia le probabili formazioni (5 fonti a nome + 1 a id) alla rosa fantacalcio.

Output:
- players_pen.json: aggiunge `tit` (0-3 = in quanti XI titolari appare) e
  `ball` (1 se citato in un ballottaggio, altrimenti 0)
- formazioni.json: dati per il pannello del tool (per squadra, per fonte:
  modulo + XI con id agganciati)
- report a video: nomi articolo non agganciati
"""
import json, re, unicodedata
from collections import defaultdict

PROJ = "/Users/luciano.murruni/Projects/asta_fantacalcio"
SCRATCH = PROJ  # formazioni_src.json ora sta nel progetto

TRANSLIT = str.maketrans({"ø": "o", "Ø": "O", "đ": "d", "Đ": "D", "ł": "l", "Ł": "L",
                          "ß": "ss", "æ": "ae", "ı": "i"})

def norm(s):
    s = s.translate(TRANSLIT)
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.lower().replace("’", "'").replace("-", " ").replace("'", " ").strip()

# nome articolo (norm) -> nome fantacalcio esatto, quando il cognome non basta
ALIAS = {
    "lautaro": "Martinez L.",
    "paz": "Nico Paz",
    "nico paz": "Nico Paz",
    "tavares": "Nuno Tavares",
    "konè": "Kone M.",
    "kone": "Kone M.",
    "mota": "Mota Carvalho",
    "santos": "Alisson Santos",
    "veiga": "Veiga D.",
    "traore": "Traorè Hj.",
    "marin": "Marin R.",
    "milinkovic": "Milinkovic-Savic V.",
    "gelli": "Gelli F.",
    "alisson santos": "Santos A.",
    "alisson": "Santos A.",
    "oyono": "Oyono A.",  # Frosinone: 33 presenze/titolare vs 2 di Oyono J.
    "martinez": "Martinez Jo.",  # Inter: ballottaggio con Provedel = portieri
    "j.rodriguez": "Rodriguez Je.",  # Como: ballottaggio con Baturina (centrocampo)
}

def split_name(n):
    n = n.strip()
    m = re.search(r"\s+((?:[A-Z][a-z]{0,3}\.\s*)+)$", n)
    initials = []
    if m:
        initials = [norm(x) for x in re.findall(r"[A-Z][a-z]{0,3}(?=\.)", m.group(1))]
        n = n[: m.start()]
    return norm(n), initials

def lev1(a, b):
    """edit distance <= 1"""
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
            i += 1; j += 1
        else:
            diff += 1
            if diff > 1:
                return False
            j += 1
    return True

def main():
    players = json.load(open(f"{PROJ}/players_pen.json"))
    src = json.load(open(f"{SCRATCH}/formazioni_src.json"))

    roster = defaultdict(list)
    by_id = {}
    for p in players:
        roster[p["s"]].append(p)
        by_id[p["id"]] = p

    unmatched = []

    def find_by_id(pid):
        """Fonti con id fantacalcio ufficiale (es. Fantacalcio.it): match diretto,
        niente euristiche di nome."""
        return by_id.get(pid)

    def find(team, raw, slot=None):
        """slot 0 = portiere."""
        if norm(raw) in ALIAS:
            want = ALIAS[norm(raw)]
            for p in roster[team]:
                if p["n"] == want:
                    return p
        sur, initials = split_name(raw)
        cands, fuzzy = [], []
        for p in roster[team]:
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
        if len(cands) > 1 and slot == 0:
            gk = [(p, i) for p, i in cands if p["r"] == "P"]
            if gk:
                cands = gk
        elif len(cands) > 1 and slot is not None and slot > 0:
            fld = [(p, i) for p, i in cands if p["r"] != "P"]
            if fld:
                cands = fld
        if len(cands) == 1:
            return cands[0][0]
        return None

    # match
    tit_count = defaultdict(int)
    # id -> set di nomi fonte in cui il giocatore è citato in un ballottaggio
    # SENZA essere titolare in quella stessa fonte (un ballottaggio elenca sia
    # il titolare in carica che il contendente: solo il secondo conta qui, il
    # primo ha già il suo pallino pieno da titolare — altrimenti prenderebbe
    # doppio credito dalla stessa fonte).
    ball_only_src = defaultdict(set)
    out = {"sources": []}
    for s in src["sources"]:
        so = {"name": s["name"], "teams": {}}
        for team, data in s["teams"].items():
            xi_out = []
            source_team_titolari = set()
            for i, raw in enumerate(data["xi"]):
                if isinstance(raw, dict):
                    p = find_by_id(raw["id"])
                    label = raw["n"]
                else:
                    p = find(team, raw, slot=i)
                    label = raw
                if p:
                    tit_count[p["id"]] += 1
                    source_team_titolari.add(p["id"])
                    xi_out.append({"id": p["id"], "n": p["n"], "r": p["r"]})
                else:
                    unmatched.append((s["name"], team, label, "XI"))
                    xi_out.append({"id": None, "n": label, "r": "?"})
            ball_out = []
            for pair in data.get("ball", []):
                bp = []
                for raw in pair:
                    p = find(team, raw)
                    if p:
                        if p["id"] not in source_team_titolari:
                            ball_only_src[p["id"]].add(s["name"])
                        bp.append(p["n"])
                    else:
                        unmatched.append((s["name"], team, raw, "ball"))
                        bp.append(raw)
                ball_out.append(bp)
            so["teams"][team] = {"mod": data["mod"], "xi": xi_out, "ball": ball_out}
        out["sources"].append(so)

    for p in players:
        p["tit"] = tit_count.get(p["id"], 0)
        p["ball"] = len(ball_only_src.get(p["id"], ()))

    json.dump(players, open(f"{PROJ}/players_pen.json", "w"), ensure_ascii=False,
              separators=(",", ":"))
    json.dump(out, open(f"{PROJ}/formazioni.json", "w"), ensure_ascii=False,
              separators=(",", ":"))

    n_sources = len(src["sources"])
    counts = {n: sum(1 for p in players if p["tit"] == n) for n in range(n_sources, 0, -1)}
    counts_str = " · ".join(f"{n}/{n_sources}: {c}" for n, c in counts.items())
    n_ball = sum(1 for p in players if p["ball"] > 0)
    print(f"titolari {counts_str} · in ballottaggio (non titolari altrove): {n_ball} giocatori")
    print(f"\nNON AGGANCIATI ({len(unmatched)}):")
    for s, t, raw, kind in unmatched:
        print(f"  [{s}] {t}: '{raw}' ({kind})")

if __name__ == "__main__":
    main()
