"""Scarica le probabilità di titolarità per la GIORNATA CORRENTE dalla pagina
hub Gazzetta (vista testuale, un unico fetch per tutte le partite) e produce
gazzetta_percentuali.json — stesso formato di sosfanta_percentuali.json, così
merge_startpct.py può incrociare le due fonti invece di dipendere da una sola.

A differenza delle 20 pagine "Formazione-tipo" già usate altrove (preview
stagionale, con rigoristi ma niente percentuali), questa pagina è specifica
per la prossima giornata: titolari, ballottaggi CON percentuale, panchina,
indisponibili — aggiornata durante la settimana, va rifatta ad ogni giornata
insieme a fetch_sosfanta_percentuali.py.

Uso: python3 scripts/fetch_gazzetta_percentuali.py
Poi: python3 scripts/merge_startpct.py (già pensato per più fonti)
"""
import html
import json
import re
import subprocess

HUB_URL = "https://www.gazzetta.it/Calcio/prob_form/"
TEXT_URL = "http://www.gazzetta.it/Calcio/prob_form/?match={}"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"


def fetch(url):
    r = subprocess.run(["curl", "-s", "-L", "-A", UA, url], capture_output=True, text=True, timeout=30)
    return r.stdout


def clean(name):
    name = html.unescape(name)
    name = re.sub(r"^[A-Z]\.\s+", "", name)  # iniziale anteposta ("K. Carlos" -> "Carlos")
    return re.sub(r"\s+", " ", name).strip(" .")


def parse_lineup(block, side):
    m = re.search(
        rf'lineup-team is--{side}">\s*<ul class="lineup-team__lineup-list">(.*?)</ul>', block, re.S
    )
    if not m:
        return []
    names = re.findall(r'lineup-team__name">\s*([^<]+?)\s*</span>', m.group(1))
    return [clean(n) for n in names]


def parse_panchina(block, side):
    m = re.search(rf'class="is--{side}">\s*<strong>Panchina:\s*</strong>\s*([^<]+)<', block)
    if not m:
        return []
    raw = clean(m.group(1))
    out = []
    for tok in raw.split(","):
        tok = tok.strip()
        # "99 Stolz" o "- Drameh" -> tiene solo il nome, il numero di maglia (o "-") non serve
        tok = re.sub(r"^[\d-]+\s+", "", tok)
        if tok:
            out.append(clean(tok))
    return out


def parse_ballottaggi(block, side):
    m = re.search(rf'class="is--{side}">\s*<strong>Ballottaggio:\s*</strong>\s*([^<]+)<', block)
    if not m:
        return []
    raw = clean(m.group(1))
    if raw.lower().startswith("nessuno"):
        return []
    out = []
    for chunk in raw.split(","):
        chunk = chunk.strip(" .")
        pm = re.match(r"^(.+?)-(.+?)\s+(\d{1,3})-(\d{1,3})%$", chunk)
        if not pm:
            continue
        a, b, pa, pb = pm.groups()
        out.append((clean(a), int(pa)))
        out.append((clean(b), int(pb)))
    return out


def parse_teams(block):
    names = re.findall(r'details-team__name"\s*\n?\s*href="[^"]*"\s*>\s*([^<]+?)\s*<', block)
    return names[0] if len(names) > 0 else None, names[1] if len(names) > 1 else None


def parse_moduli(block):
    mods = re.findall(r"<strong>Modulo:</strong>\s*([\d-]+)", block)
    return (mods[0] if len(mods) > 0 else None), (mods[1] if len(mods) > 1 else None)


def main():
    hub = fetch(HUB_URL)
    match_ids = list(dict.fromkeys(re.findall(r'id="match-(\d+)"', hub)))
    print(f"{len(match_ids)} partite trovate nella pagina hub")

    # La vista testuale di UNA partita contiene in realtà tutte le partite
    # della giornata nella stessa pagina — basta un fetch, non uno per match.
    page = fetch(TEXT_URL.format(match_ids[0])) if match_ids else hub

    blocks = re.split(r'id="match-\d+"', page)[1:]

    matches = []
    for block in blocks:
        home, away = parse_teams(block)
        home_mod, away_mod = parse_moduli(block)
        if not home or not away:
            continue
        players = {}
        for side, team in (("home", home), ("away", away)):
            for n in parse_lineup(block, side):
                players[n] = 95
            for n in parse_panchina(block, side):
                players.setdefault(n, 5)
            for n, pct in parse_ballottaggi(block, side):
                players[n] = pct
        matches.append({
            "home": home,
            "away": away,
            "homeMod": home_mod,
            "awayMod": away_mod,
            "players": [{"n": n, "pct": p} for n, p in players.items()],
        })

    out = {"matches": matches}
    json.dump(out, open("gazzetta_percentuali.json", "w"), ensure_ascii=False, indent=1)

    tot = sum(len(m["players"]) for m in matches)
    print(f"{len(matches)} partite, {tot} giocatori con percentuale")
    for m in matches:
        print(f"  {m['home']} ({m['homeMod']}) - {m['away']} ({m['awayMod']}): {len(m['players'])} giocatori")


if __name__ == "__main__":
    main()
