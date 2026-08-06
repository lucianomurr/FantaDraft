#!/usr/bin/env python3
"""Allinea il flag `pen` alle gerarchie rigoristi della Gazzetta.

Primo nome = pen 1 (designato), gli altri = pen 2 (alternative), tutti gli altri
giocatori = pen 0. Aggiornare GAZ_RIG al refresh pre-asta (blocco "Calci di
rigore:" in fondo agli articoli Gazzetta per squadra, vedi fonti_formazioni.md).
"""
import json, re, unicodedata

PROJ = "/Users/luciano.murruni/Projects/asta_fantacalcio"

GAZ_RIG = {  # 06/08/2026
    "Atalanta": ["Scamacca", "De Ketelaere", "Samardzic"],
    "Bologna": ["Orsolini", "Dovbyk", "Bernardeschi"],
    "Cagliari": ["Mina", "Borrelli", "Fazzini"],
    "Como": ["Da Cunha", "Nico Paz", "Douvikas"],
    "Fiorentina": ["Gudmundsson", "Kean", "Mandragora"],
    "Frosinone": ["Calò"],
    "Genoa": ["Colombo", "Vitinha", "Ostigard", "Messias"],
    "Inter": ["Calhanoglu", "Zielinski", "Lautaro"],
    "Juventus": ["Kolo Muani", "Locatelli", "Yildiz"],
    "Lazio": ["Zaccagni", "Taylor", "Cataldi"],
    "Lecce": ["Stulic", "Berisha"],
    "Milan": ["Pulisic", "Leao", "Nkunku", "Ramos"],
    "Monza": ["Pessina", "Cutrone"],
    "Napoli": ["De Bruyne", "Hojlund", "McTominay"],
    "Parma": ["Pellegrino", "Bernabè"],
    "Roma": ["Malen", "Dybala"],
    "Sassuolo": ["Berardi", "Pinamonti", "Laurientè"],
    "Torino": ["Vlasic", "Simeone", "Casadei"],
    "Udinese": ["Davis", "Zaniolo", "Solet"],
    "Venezia": ["Adams", "Yeboah", "Rrahmani"],
}

ALIAS = {"lautaro": "Martinez L.", "nico paz": "Paz N.", "ramos": "Ramos G.",
         "taylor": "Taylor K."}

def norm(s):
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.lower().replace("-", " ").replace("'", " ").strip()

def surname(n):
    return norm(re.sub(r"(\s+[A-Z][a-z]{0,3}\.)+$", "", n.strip()))

def main():
    players = json.load(open(f"{PROJ}/players_pen.json"))
    changed, unmatched = [], []

    for p in players:
        p["_newpen"] = 0
    for team, names in GAZ_RIG.items():
        roster = [p for p in players if p["s"] == team]
        for i, raw in enumerate(names):
            want = ALIAS.get(norm(raw))
            cands = [p for p in roster if p["n"] == want] if want else \
                    [p for p in roster if surname(p["n"]) == norm(raw)
                     or surname(p["n"]).endswith(" " + norm(raw))
                     or norm(raw).endswith(" " + surname(p["n"]))]
            if len(cands) == 1:
                cands[0]["_newpen"] = 1 if i == 0 else 2
            else:
                unmatched.append((team, raw, len(cands)))

    for p in players:
        new = p.pop("_newpen")
        if p["pen"] != new:
            changed.append((p["n"], p["s"], p["pen"], new))
            p["pen"] = new

    json.dump(players, open(f"{PROJ}/players_pen.json", "w"), ensure_ascii=False,
              separators=(",", ":"))
    print(f"cambiati {len(changed)}:")
    for n, s, a, b in changed:
        print(f"  {n} ({s}): {a} -> {b}")
    if unmatched:
        print("NON AGGANCIATI:")
        for t, raw, k in unmatched:
            print(f"  {t}: '{raw}' ({k} candidati)")

if __name__ == "__main__":
    main()
