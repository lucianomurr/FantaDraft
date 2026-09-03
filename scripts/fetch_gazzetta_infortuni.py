"""Estrae la lista "Indisponibili" per squadra dalla stessa pagina hub
Gazzetta usata per fetch_gazzetta_percentuali.py (vista testuale, tutte le
10 partite della giornata in un solo fetch) — usata per un controllo
incrociato rapido su infortuni.json (fonte primaria fantacalcio.it/
infortunati-serie-a), non per sostituirlo: qui il dato è "nome (stato
sintetico)" senza la diagnosi articolata che ha l'altra fonte.

Scrive gazzetta_infortuni_raw.json (solo lettura di appoggio, non un
dataset del progetto) con {squadra: [{n, stato}]}. Poi confronta a mano/
con merge_gazzetta_infortuni.py contro infortuni.json esistente.

Uso: python3 scripts/fetch_gazzetta_infortuni.py
"""
import json
import re
import subprocess

HUB_URL = "https://www.gazzetta.it/Calcio/prob_form/"
TEXT_URL = "http://www.gazzetta.it/Calcio/prob_form/?match={}"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"


def fetch(url):
    r = subprocess.run(["curl", "-s", "-L", "-A", UA, url], capture_output=True, text=True, timeout=30)
    return r.stdout


def clean(s):
    return re.sub(r"\s+", " ", s).strip(" .")


def parse_teams(block):
    names = re.findall(r'details-team__name"\s*\n?\s*href="[^"]*"\s*>\s*([^<]+?)\s*<', block)
    return (names[0] if len(names) > 0 else None), (names[1] if len(names) > 1 else None)


def parse_indisponibili(block, side):
    m = re.search(rf'class="is--{side}">\s*<strong>Indisponibili:\s*</strong>\s*([^<]+)<', block)
    if not m:
        return []
    raw = clean(m.group(1))
    if not raw or raw.lower().startswith("nessuno"):
        return []
    out = []
    for chunk in raw.split(","):
        chunk = chunk.strip(" .")
        pm = re.match(r"^(.+?)\s*\((.+?)\)$", chunk)
        if pm:
            out.append({"n": clean(pm.group(1)), "stato": clean(pm.group(2))})
        elif chunk:
            out.append({"n": chunk, "stato": ""})
    return out


def main():
    hub = fetch(HUB_URL)
    match_ids = list(dict.fromkeys(re.findall(r'id="match-(\d+)"', hub)))
    page = fetch(TEXT_URL.format(match_ids[0])) if match_ids else hub
    blocks = re.split(r'id="match-\d+"', page)[1:]

    out = {}
    for block in blocks:
        home, away = parse_teams(block)
        if not home or not away:
            continue
        out[home] = parse_indisponibili(block, "home")
        out[away] = parse_indisponibili(block, "away")

    json.dump(out, open("gazzetta_infortuni_raw.json", "w"), ensure_ascii=False, indent=1)
    tot = sum(len(v) for v in out.values())
    print(f"{len(out)} squadre, {tot} indisponibili totali")
    for team, players in out.items():
        if players:
            print(f"  {team}: {', '.join(p['n'] + ' (' + p['stato'] + ')' for p in players)}")


if __name__ == "__main__":
    main()
