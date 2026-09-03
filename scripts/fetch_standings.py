"""Scarica gol fatti/subiti per squadra (stagione 2026/27 in corso) da FBref,
usati dalla Formazione consigliata per pesare i titolari in base
all'avversario della giornata (una squadra che concede molto contro un
avversario che segna molto ha più rischio, e viceversa un attacco forte
contro una difesa debole va premiato).

Campione piccolo per definizione a inizio stagione (poche giornate
giocate) — è dichiarato come tale nell'euristica che lo usa, non va
trattato come dato consolidato.

Uso: python3 scripts/fetch_standings.py
Poi: cp standings.json web/data/standings.json
"""
import json

import soccerdata as sd


def flat(df):
    df = df.copy()
    df.columns = ["_".join([str(c) for c in col if c]).strip("_") for col in df.columns.to_flat_index()]
    return df.reset_index()


def main():
    fb = sd.FBref(leagues="ITA-Serie A", seasons=["2627"], no_cache=True)
    gf = flat(fb.read_team_season_stats(stat_type="standard"))
    ga = flat(fb.read_team_season_stats(stat_type="standard", opponent_stats=True))
    ga["team"] = ga["team"].str.replace("^vs ", "", regex=True)

    m = gf[["team", "Playing Time_MP", "Performance_Gls"]].merge(
        ga[["team", "Performance_Gls"]], on="team", suffixes=("_for", "_against")
    )

    out = {}
    for _, r in m.iterrows():
        out[r["team"]] = {
            "mp": int(r["Playing Time_MP"]),
            "gf": int(r["Performance_Gls_for"]),
            "ga": int(r["Performance_Gls_against"]),
        }

    json.dump(out, open("standings.json", "w"), ensure_ascii=False, indent=1)
    print(f"{len(out)} squadre")
    for team, s in sorted(out.items(), key=lambda x: -x[1]["gf"]):
        print(f"  {team}: {s['mp']} giocate, {s['gf']} fatti, {s['ga']} subiti")


if __name__ == "__main__":
    main()
