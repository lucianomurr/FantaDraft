"""Scarica la lista infortunati da fantacalcio.it/infortunati-serie-a via
curl + regex (nessuna dipendenza da WebFetch/AI) e riscrive infortuni.json
da zero — pagina server-renderizzata, niente login richiesto.

Split diagnosi/rientro euristico: il sito dà un unico paragrafo prosa, non
due campi separati. Si spezza sull'ultima frase che contiene una parola
chiave di rientro ("rientro", "recuperabile", "tornerà", "tempi di
recupero", "punta a tornare", "ipotesi rientro", "convocabile") — stesso
approccio già usato a mano nel refresh del 17/08/2026 (vedi CLAUDE.md).
Se nessuna frase la contiene, l'intero paragrafo va in `d` e `r` resta
generico.

Uso: python3 scripts/fetch_infortuni.py
Poi: python3 scripts/merge_infortuni.py
"""
import datetime
import html
import json
import os
import re
import subprocess

PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = "https://www.fantacalcio.it/infortunati-serie-a"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

RIENTRO_KEYWORDS = (
    "rientro", "recuperabile", "tornerà", "tornare", "tempi di recupero",
    "ipotesi rientro", "convocabile", "arruolabile", "sarà out",
    "ai box", "verrà valutat", "da valutare", "stop di",
)


def fetch():
    r = subprocess.run(["curl", "-s", "-A", UA, URL], capture_output=True, text=True, timeout=30)
    return r.stdout


def clean(s):
    s = html.unescape(s)
    s = re.sub(r"<[^>]+>", "", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def split_diagnosi_rientro(text):
    # 1° livello: spezza in frasi su ". " e cerca la parola chiave nell'ultima
    # frase che ne contiene una (non perfetto con abbreviazioni, sufficiente qui).
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
    if len(sentences) > 1:
        for i in range(len(sentences) - 1, 0, -1):
            low = sentences[i].lower()
            if any(k in low for k in RIENTRO_KEYWORDS):
                d = " ".join(sentences[:i]).strip()
                r = " ".join(sentences[i:]).strip()
                if d:
                    return d, r

    # 2° livello: un'unica frase con la parola chiave in una clausola separata
    # da virgola o da "e" (pattern comune: "lesione X, recuperabile da Y" /
    # "...vittima di Z e recuperabile da Y").
    parts = re.split(r"(,\s*|\s+e\s+)", text)
    clauses, seps = parts[0::2], parts[1::2]
    if len(clauses) > 1:
        for i in range(len(clauses) - 1, 0, -1):
            low = clauses[i].lower()
            if any(k in low for k in RIENTRO_KEYWORDS):
                d = "".join(c + s for c, s in zip(clauses[:i], seps[:i])).strip().rstrip(",").strip()
                r = clauses[i].strip()
                if d:
                    return d, r

    # nessuna clausola con parola chiave: tutta diagnosi, rientro generico
    return text, "Tempi di recupero da valutare."


def main():
    page = fetch()
    if "team-card" not in page:
        print("ATTENZIONE: pagina non nel formato atteso (nessun team-card trovato) — nessuna modifica.")
        return

    blocks = re.split(r'<div id="team-\d+" class="card team-card">', page)[1:]

    infortunati = []
    for block in blocks:
        name_m = re.search(r'<span class="team-name">([^<]+)</span>', block)
        if not name_m:
            continue
        team = clean(name_m.group(1))

        # limita il blocco al contenuto della card (fino al prossimo team-card o footer)
        card_end = block.find('<div id="team-')
        card = block[:card_end] if card_end != -1 else block

        items = re.findall(
            r'<strong class="item-name">([^<]+)</strong>\s*'
            r'<div class="item-description"><p>(.*?)</p></div>',
            card,
            re.S,
        )
        for raw_name, raw_desc in items:
            name = clean(raw_name)
            desc = clean(raw_desc)
            if not desc:
                continue
            d, r = split_diagnosi_rientro(desc)
            infortunati.append({"s": team, "n": name, "d": d, "r": r})

    if not infortunati:
        print("ATTENZIONE: 0 infortunati estratti — probabile cambio di formato pagina, nessuna modifica scritta.")
        return

    out = {"aggiornato": datetime.date.today().isoformat(), "infortunati": infortunati}
    json.dump(out, open(f"{PROJ}/infortuni.json", "w"), ensure_ascii=False, indent=1)

    print(f"{len(infortunati)} infortunati estratti da {len(blocks)} squadre")
    for it in infortunati:
        print(f"  [{it['s']}] {it['n']}: {it['d'][:60]}...")


if __name__ == "__main__":
    main()
