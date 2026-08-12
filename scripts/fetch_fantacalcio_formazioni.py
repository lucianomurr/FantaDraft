"""Scarica le probabili formazioni da fantacalcio.it/probabili-formazioni-serie-a
(pagina "prossima giornata", NON un preview stagionale come le altre 5 fonti —
da rifare a ridosso di ogni asta insieme al resto, così riflette la giornata
in corso invece di una passata).

A differenza delle altre fonti, gli URL dei giocatori contengono l'id
fantacalcio ufficiale (stesso id di players_pen.json): matching diretto per
id in scripts/build_formazioni.py, niente euristiche di nome.

Produce fantacalcio_it_src.json: {"Squadra": {"mod":.., "xi":[{"id":..,"n":..}, ...], "ball":[]}}

Uso: python3 scripts/fetch_fantacalcio_formazioni.py
"""
import html
import json
import re
import subprocess

URL = "https://www.fantacalcio.it/probabili-formazioni-serie-a"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
OUT_PATH = "fantacalcio_it_src.json"

TEAM_BLOCK_RE = re.compile(
    r'data-team-formation="([\d-]+)">\s*<ul class="team-lineup"[^>]*>(.*?)</ul>',
    re.S,
)
NAME_BEFORE_RE = re.compile(
    r'<meta itemprop="name" content="([^"]+)" />\s*'
    r'<meta itemprop="url" content="https://www\.fantacalcio\.it/serie-a/squadre/',
)
PLAYER_RE = re.compile(
    r'href="https://www\.fantacalcio\.it/serie-a/squadre/[^/]+/[^/]+/(\d+)"[^>]*>.*?<span>([^<]+)</span>',
    re.S,
)


def fetch():
    r = subprocess.run(["curl", "-s", "-A", UA, URL], capture_output=True, text=True, timeout=30)
    return r.stdout


def parse(h):
    all_names = [m.group(1) for m in NAME_BEFORE_RE.finditer(h)]
    blocks = list(TEAM_BLOCK_RE.finditer(h))
    # le prime N occorrenze di nome sono il sommario partite in cima alla pagina
    # (una coppia home/away per match); le successive sono 1:1 coi blocchi
    # formazione (una coppia nome-squadra subito prima di ogni sezione).
    names_for_blocks = all_names[len(all_names) - len(blocks):]
    if len(names_for_blocks) != len(blocks):
        raise ValueError(
            f"nomi ({len(names_for_blocks)}) e blocchi formazione ({len(blocks)}) non combaciano — pagina cambiata?"
        )

    result = {}
    for team, m in zip(names_for_blocks, blocks):
        formation, players_html = m.group(1), m.group(2)
        players = PLAYER_RE.findall(players_html)
        # la pagina lista attacco -> portiere; le altre 5 fonti (e il pannello
        # confronto nel tool) usano portiere -> attacco, quindi si inverte qui.
        xi = [{"id": int(pid), "n": html.unescape(name)} for pid, name in reversed(players)]
        result[team] = {"mod": formation, "xi": xi, "ball": []}
    return result


def main():
    h = fetch()
    result = parse(h)
    json.dump(result, open(OUT_PATH, "w"), ensure_ascii=False, indent=1)
    print(f"squadre trovate: {len(result)}/20")
    for team, d in result.items():
        print(f"  {team}: {d['mod']}, {len(d['xi'])} titolari")


if __name__ == "__main__":
    main()
