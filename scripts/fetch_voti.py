"""Scarica i voti/fantavoto reali (fonte: Redazione Fantacalcio) per le
giornate già giocate da https://www.fantacalcio.it/voti-fantacalcio-serie-a/2026-27/{N}
e li aggiunge come storico puro sul giocatore (campo `voti`), SENZA toccare
Val/fasce/preset — solo dato informativo in più nella scheda giocatore
(scelta esplicita di Luciano, 04/09/2026: niente sostituzione della formula
Val esistente basata su xG/gol).

La pagina è server-rendered con l'id ufficiale fantacalcio nell'URL del
giocatore (es. .../atalanta/carnesecchi/4431) — stesso id di
players_pen.json, match diretto per id, niente euristiche di nome.

Uso: python3 scripts/fetch_voti.py [giornate...]   (default: 1 2)
Produce voti.json: {"1": {"<id>": {"v": 6.5, "fv": 6.5}, ...}, "2": {...}}
Poi: python3 scripts/merge_voti.py
"""
import html
import json
import os
import re
import subprocess
import sys

PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
URL_TMPL = "https://www.fantacalcio.it/voti-fantacalcio-serie-a/2026-27/{g}"

PLAYER_RE = re.compile(
    r'<span class="role" data-value="(?P<role>[pdca])"></span>\s*'
    r'<a class="player-name player-link"[^>]*href="[^"]*/(?P<id>\d+)"[^>]*>\s*'
    r'<span>(?P<name>[^<]+)</span>\s*</a>.*?'
    r'<div class="pill">\s*'
    r'<span class="player-grade[^"]*" data-value="(?P<v>[^"]*)"></span>\s*'
    r'<span class="player-fanta-grade" data-value="(?P<fv>[^"]*)"></span>',
    re.DOTALL,
)


def fetch(giornata: int) -> str:
    url = URL_TMPL.format(g=giornata)
    out = subprocess.run(["curl", "-sL", "-A", UA, url], capture_output=True, text=True, timeout=60)
    return out.stdout


def parse(html_text: str) -> dict:
    out = {}
    for m in PLAYER_RE.finditer(html_text):
        v, fv = m.group("v").replace(",", "."), m.group("fv").replace(",", ".")
        if not v or not fv:
            continue
        pid = int(m.group("id"))
        out[pid] = {"v": float(v), "fv": float(fv), "n": html.unescape(m.group("name")).strip()}
    return out


def main():
    giornate = [int(x) for x in sys.argv[1:]] or [1, 2]
    out_path = f"{PROJ}/voti.json"
    data = json.load(open(out_path)) if os.path.exists(out_path) else {}

    for g in giornate:
        text = fetch(g)
        parsed = parse(text)
        data[str(g)] = {str(pid): {"v": d["v"], "fv": d["fv"]} for pid, d in parsed.items()}
        print(f"Giornata {g}: {len(parsed)} giocatori con voto")

    json.dump(data, open(out_path, "w"), ensure_ascii=False, indent=1)
    print(f"Scritto {out_path}")


if __name__ == "__main__":
    main()
