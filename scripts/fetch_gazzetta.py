"""Rifà il fetch delle 20 pagine Gazzetta (probabili formazioni + rigoristi) e
produce gazzetta_src.json: {"Squadra": {"mod":..,"xi":[...11...],"ball":[],"rig":[...]}}.

WebFetch è bloccato su gazzetta.it: si scarica con curl (UA browser) e si
estrae il testo dal JSON-LD articleBody, poi si fa match sul blocco finale
"(modulo): XI. Allenatore: X. Calci di rigore: ...".

Uso: python3 scripts/fetch_gazzetta.py
"""
import json
import re
import subprocess

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

URLS = {
    "Atalanta": "https://www.gazzetta.it/calcio/fantanews/02-08-2026/atalanta-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml",
    "Bologna": "https://www.gazzetta.it/calcio/fantanews/03-08-2026/bologna-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml",
    "Cagliari": "https://www.gazzetta.it/calcio/fantanews/04-08-2026/cagliari-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml",
    "Como": "https://www.gazzetta.it/calcio/fantanews/04-08-2026/como-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml",
    "Fiorentina": "https://www.gazzetta.it/calcio/fantanews/02-08-2026/fiorentina-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml",
    "Frosinone": "https://www.gazzetta.it/calcio/fantanews/02-08-2026/frosinone-al-fantacalcio-2026-27-titolari-rigorista-sorprese-e-consigli-su-chi-prendere.shtml",
    "Genoa": "https://www.gazzetta.it/calcio/fantanews/04-08-2026/genoa-al-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml",
    "Inter": "https://www.gazzetta.it/calcio/fantanews/05-08-2026/inter-al-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml",
    "Juventus": "https://www.gazzetta.it/calcio/fantanews/03-08-2026/juve-al-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml",
    "Lazio": "https://www.gazzetta.it/calcio/fantanews/02-08-2026/lazio-al-fantacalcio-2026-27-titolari-rigorista-sorprese-e-consigli-su-chi-prendere.shtml",
    "Lecce": "https://www.gazzetta.it/calcio/fantanews/04-08-2026/lecce-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml",
    "Milan": "https://www.gazzetta.it/calcio/fantanews/02-08-2026/milan-al-fantacalcio-2026-27-titolari-rigorista-sorprese-e-consigli-su-chi-prendere.shtml",
    "Monza": "https://www.gazzetta.it/calcio/fantanews/05-08-2026/monza-al-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml",
    "Napoli": "https://www.gazzetta.it/calcio/fantanews/02-08-2026/napoli-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml",
    "Parma": "https://www.gazzetta.it/calcio/fantanews/03-08-2026/parma-al-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml",
    "Roma": "https://www.gazzetta.it/calcio/fantanews/03-08-2026/roma-al-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml",
    "Sassuolo": "https://www.gazzetta.it/calcio/fantanews/04-08-2026/sassuolo-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml",
    "Torino": "https://www.gazzetta.it/calcio/fantanews/03-08-2026/torino-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml",
    "Udinese": "https://www.gazzetta.it/calcio/fantanews/03-08-2026/udinese-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml",
    "Venezia": "https://www.gazzetta.it/calcio/fantanews/04-08-2026/venezia-al-fantacalcio-2026-27-titolari-rigorista-sorprese-consigli-su-chi-prendere.shtml",
}

BLOCK_RE = re.compile(
    r"\((\d(?:-\d)+)\):\s*(.+?)\.\s*Allenatore:\s*(.+?)\.?\s*Calci di rigore:\s*(.+?)\.?\s*$",
    re.S,
)
# variante "Allenatore: X Squadra, i rigoristi: A, B, C" (niente "Calci di rigore:")
BLOCK_RE2 = re.compile(
    r"\((\d(?:-\d)+)\):\s*(.+?)\.\s*Allenatore:\s*.+?,\s*i rigoristi:\s*(.+?)\.?\s*$",
    re.S,
)


def clean(s):
    s = s.replace("&nbsp;", " ").replace("&nbsp", " ").replace("\xa0", " ")
    return s.strip(" .")


def fetch(url):
    r = subprocess.run(["curl", "-s", "-A", UA, url], capture_output=True, text=True, timeout=30)
    return r.stdout


def extract_body(html):
    m = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
    if not m:
        return None
    data = json.loads(m.group(1))
    if isinstance(data, list):
        data = data[0]
    return data.get("articleBody", "")


def parse_block(body):
    m = BLOCK_RE.search(body)
    if m:
        mod, xi_raw, _coach, rig_raw = m.groups()
    else:
        m = BLOCK_RE2.search(body)
        if not m:
            return None
        mod, xi_raw, rig_raw = m.groups()
    xi_raw, rig_raw = clean(xi_raw), clean(rig_raw)
    xi_all = [clean(n) for n in re.split(r"[,;]", xi_raw) if clean(n)]
    xi, seen = [], set()
    for n in xi_all:
        if n not in seen:
            xi.append(n)
            seen.add(n)
    xi = xi[:11]
    rig = [clean(n) for n in re.split(r"[,;]", rig_raw) if clean(n)]
    return {"mod": mod, "xi": xi, "ball": [], "rig": rig}


def main():
    out = {}
    failed = []
    for team, url in URLS.items():
        html = fetch(url)
        body = extract_body(html)
        parsed = parse_block(body) if body else None
        if not parsed:
            failed.append(team)
            continue
        out[team] = parsed
        print(f"{team}: {parsed['mod']} xi={len(parsed['xi'])} rig={parsed['rig']}")

    json.dump(out, open("gazzetta_src.json", "w"), ensure_ascii=False, indent=1)
    print(f"\nOK: {len(out)}/20")
    if failed:
        print("FALLITI:", failed)


if __name__ == "__main__":
    main()
