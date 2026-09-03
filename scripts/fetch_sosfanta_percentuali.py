"""Scarica le probabilità di titolarità per la GIORNATA CORRENTE da SOS Fanta
(pagina "Lista formazioni" con percentuali, non il preview stagionale già
usato altrove) e produce sosfanta_percentuali.json.

A differenza delle altre 5 fonti probabili formazioni (preview stagionale,
conteggio 0-6 fonti), questa pagina è specifica per la prossima giornata di
campionato e dà una percentuale 0-100 per OGNI giocatore (titolari,
ballottaggi, panchina) — molto più utile per suggerire la formazione da
schierare che un semplice conteggio "quante fonti lo danno titolare".
Va rifatta ogni settimana, prima di ogni giornata (dato volatile per
definizione, si aggiorna coi dubbi di formazione durante la settimana).

Uso: python3 scripts/fetch_sosfanta_percentuali.py
Poi: python3 scripts/merge_startpct.py
"""
import html
import json
import re
import subprocess

URL = "https://www.sosfanta.com/lista-formazioni/probabili-formazioni-serie-a/"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

FLAT_RE = re.compile(
    r'<span[^>]*>\s*(\d{1,3})%\s*</span>\s*<span[^>]*text-\[#333\][^>]*>\s*([^<]+?)\s*</span>',
    re.S,
)
BALL_RE = re.compile(
    r'<span[^>]*>\s*(\d{1,3})%\s*</span>\s*<span aria-hidden="true">-</span>\s*<span[^>]*>\s*(\d{1,3})%\s*</span>.*?'
    r'<span class="max-w-full[^"]*"[^>]*>\s*([^<]+?)\s*</span>',
    re.S,
)


def fetch():
    r = subprocess.run(["curl", "-s", "-A", UA, URL], capture_output=True, text=True, timeout=30)
    return r.stdout


def section(block, start_marker, end_markers):
    i = block.find(start_marker)
    if i == -1:
        return ""
    i += len(start_marker)
    end = len(block)
    for m in end_markers:
        j = block.find(m, i)
        if j != -1:
            end = min(end, j)
    return block[i:end]


def parse_flat(block_html):
    out = []
    for pct, name in FLAT_RE.findall(block_html):
        out.append((html.unescape(name.strip()), int(pct)))
    return out


def parse_ballottaggi(block_html):
    """Ogni ballottaggio -> due entry (nome, %, rivale) — il rivale serve a
    segnalare in UI chi contende la maglia, non solo che è in dubbio."""
    out = []
    for pct_a, pct_b, names in BALL_RE.findall(block_html):
        names = html.unescape(names)
        if " - " not in names:
            continue
        a, b = [n.strip() for n in names.split(" - ", 1)]
        out.append((a, int(pct_a), b))
        out.append((b, int(pct_b), a))
    return out


def main():
    page_html = fetch()

    match_ids = list(dict.fromkeys(re.findall(r'data-match-id="([a-z0-9-]+)"', page_html)))
    match_ids = [m for m in match_ids if m != "all"]

    blocks = re.split(r'data-match-id="[a-z0-9-]+"\s*>', page_html)[1:]
    if len(blocks) != len(match_ids):
        print(f"ATTENZIONE: {len(match_ids)} match-id ma {len(blocks)} blocchi — controlla a mano")

    dates = re.findall(r'<time datetime="([^"]+)"', page_html)

    matches = []
    for idx, block in enumerate(blocks):
        teams = re.findall(r'<h2[^>]*>\s*([^<]+?)\s*</h2>', block)
        mods = re.findall(r'text-primary">\s*([\d-]+)\s*</span>', block)
        if len(teams) < 2 or len(mods) < 2:
            print(f"salto blocco {idx} ({match_ids[idx] if idx < len(match_ids) else '?'}): squadre/moduli non trovati")
            continue
        home, away = teams[0], teams[1]
        home_mod, away_mod = mods[0], mods[1]

        titolari_html = section(block, ">Titolari<", ["Ballottaggi<", "Panchina<"])
        ball_html = section(block, ">Ballottaggi<", ["Panchina<"])
        panchina_html = section(block, ">Panchina<", [])

        players = {}
        for n, p in parse_flat(titolari_html):
            players[n] = {"pct": p, "riv": None}
        for n, p, riv in parse_ballottaggi(ball_html):
            players.setdefault(n, {"pct": p, "riv": riv})
        for n, p in parse_flat(panchina_html):
            players.setdefault(n, {"pct": p, "riv": None})

        matches.append({
            "home": home,
            "away": away,
            "homeMod": home_mod,
            "awayMod": away_mod,
            "date": dates[idx] if idx < len(dates) else None,
            "players": [{"n": n, "pct": v["pct"], "riv": v["riv"]} for n, v in players.items()],
        })

    all_dates = [m["date"] for m in matches if m["date"]]
    periodo = None
    if all_dates:
        periodo = f"{min(all_dates)[:10]} - {max(all_dates)[:10]}"

    out = {"periodo": periodo, "matches": matches}
    json.dump(out, open("sosfanta_percentuali.json", "w"), ensure_ascii=False, indent=1)

    tot = sum(len(m["players"]) for m in matches)
    print(f"{len(matches)} partite, {tot} giocatori con percentuale, periodo {periodo}")
    for m in matches:
        print(f"  {m['home']} ({m['homeMod']}) - {m['away']} ({m['awayMod']}): {len(m['players'])} giocatori")


if __name__ == "__main__":
    main()
