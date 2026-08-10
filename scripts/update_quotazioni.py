"""Aggiorna id/ruolo/nome/squadra/Qt/FVM (Classic + Mantra) in players_pen.json
dal listone ufficiale Fantacalcio.it (foglio "Tutti" di quotazioni_raw.xlsx,
scaricato a mano dal bottone "Scarica" su
https://www.fantacalcio.it/quotazioni-fantacalcio).

Aggiorna i giocatori esistenti (per id), aggiunge i nuovi con campi di
arricchimento vuoti (stat=False, come i "senza dati"), rimuove chi non è più
nel listone (uscite/cessioni). Non tocca fasce/pt/statistiche dei giocatori
già presenti. `rm`/`fvmM` (ruoli e FVM Mantra) vengono risincronizzati per
TUTTI i giocatori a ogni run, anche quando Qt/FVM Classic non sono cambiati.

Uso: python3 scripts/update_quotazioni.py
"""
import json

import openpyxl

XLSX_PATH = "quotazioni_raw.xlsx"
PEN_PATH = "players_pen.json"

NEW_PLAYER_DEFAULTS = {
    "pen": 0,
    "tit": 0,
    "ball": 0,
    "gls": 0,
    "ast": 0,
    "pk": 0,
    "pkatt": 0,
    "min": 0,
    "mp": 0,
    "starts": 0,
    "sea": None,
    "src": None,
    "stat": False,
    "nat": None,
    "born": None,
    "hist": [],
    "pt": None,
    "xg": 0.0,
    "xa": 0.0,
    "npxg": 0.0,
    "sh": 0,
    "kp": 0,
}


def load_xlsx_players():
    wb = openpyxl.load_workbook(XLSX_PATH, data_only=True)
    ws = wb["Tutti"]
    players = {}
    for row in ws.iter_rows(min_row=3, values_only=True):
        if row[0] is None:
            continue
        pid = int(row[0])
        rm = [tok.strip() for tok in str(row[2] or "").split(";") if tok.strip()]
        players[pid] = {
            "r": row[1],
            "rm": rm,
            "n": row[3],
            "s": row[4],
            "q": row[5],
            "f": row[11],
            "fvmM": row[12],
        }
    return players


def main():
    xlsx_players = load_xlsx_players()
    pen = json.load(open(PEN_PATH))
    pen_by_id = {p["id"]: p for p in pen}

    updated = []
    for pid, x in xlsx_players.items():
        if pid in pen_by_id:
            p = pen_by_id[pid]
            if (p["r"], p["n"], p["s"], p["q"], p["f"]) != (x["r"], x["n"], x["s"], x["q"], x["f"]):
                updated.append((pid, p["n"], dict(p), x))
            p["r"], p["n"], p["s"], p["q"], p["f"] = x["r"], x["n"], x["s"], x["q"], x["f"]
            p["rm"], p["fvmM"] = x["rm"], x["fvmM"]

    new_ids = set(xlsx_players) - set(pen_by_id)
    gone_ids = set(pen_by_id) - set(xlsx_players)

    for pid in new_ids:
        x = xlsx_players[pid]
        entry = {
            "id": pid,
            "r": x["r"],
            "rm": x["rm"],
            "n": x["n"],
            "s": x["s"],
            "q": x["q"],
            "f": x["f"],
            "fvmM": x["fvmM"],
        }
        entry.update(NEW_PLAYER_DEFAULTS)
        pen.append(entry)

    pen = [p for p in pen if p["id"] not in gone_ids]

    role_order = {"P": 0, "D": 1, "C": 2, "A": 3}
    pen.sort(key=lambda p: (role_order.get(p["r"], 9), -p["f"]))

    json.dump(pen, open(PEN_PATH, "w"), ensure_ascii=False, indent=1)

    print(f"Giocatori totali: {len(pen)}")
    print(f"Aggiornati (q/f/squadra/nome cambiati): {len(updated)}")
    for pid, name, old, x in updated:
        print(f"  {pid} {name}: q {old['q']}->{x['q']} f {old['f']}->{x['f']} s {old['s']}->{x['s']}")
    print(f"Nuovi ({len(new_ids)}):")
    for pid in new_ids:
        x = xlsx_players[pid]
        print(f"  {pid} {x['n']} {x['r']} {x['s']}")
    print(f"Usciti/ceduti, rimossi ({len(gone_ids)}):")
    for pid in gone_ids:
        p = pen_by_id[pid]
        print(f"  {pid} {p['n']} {p['r']} {p['s']}")


if __name__ == "__main__":
    main()
