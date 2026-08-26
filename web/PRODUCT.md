# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Fantacalcio (Italian fantasy football) players in Classic-format leagues (10 teams,
500-credit budget, 3 goalkeepers / 8 defenders / 8 midfielders / 6 attackers roster)
preparing for and running their season auction draft. Primary audience is the Italian
fantacalcio community at large (the tool is public, free, no login) — not a single
private user, even though it originated from one league's prep. Two distinct usage
moments with different needs: (1) pre-auction prep, usually at a desk/laptop, calm and
unhurried, tiering ~500 players and setting target prices; (2) the live auction itself —
often noisy, fast, time-pressured, sometimes run partly from a phone — where the user
needs to look up a called player in seconds, see a suggested price, mark bought/taken,
and track remaining budget without losing the thread of the auction happening around them.
[Inferred from extensive existing product history in this session and CLAUDE.md; not
re-confirmed with the user in a dedicated interview round.]

## Product Purpose

A free, open-source web tool that replaces a blank spreadsheet/listone for fantacalcio
auction prep and live tracking. It pre-cross-references quotazioni (official price
list) with real performance data (FBref/Understat stats, probable lineups from 6
sources, injuries, penalty-taker hierarchy, transfer news) so the user reasons from
already-merged signal instead of manually stitching together a dozen tabs. Success =
the user arrives at auction day with a tiered shortlist + target prices, and during the
auction can track purchases/budget live without falling behind the pace of bidding.

## Positioning

Unlike a static official listone or a generic spreadsheet template, every player row
already carries cross-referenced real signal (goals/assists/xG/xA, probable-lineup
consensus across 6 outlets, injury status, penalty-taker rank, recent transfers) with
the source declared per field, plus a transparent, tunable "Val" convenience score
(formula shown, never a black box) and a live budget/tracking layer for the auction
itself — not just prep, but the draft day too.

## Operating Context

- Pre-auction: browser session (any device), setting fasce (tiers 1–4, R=riserva,
  X=evita) and target prices per player, informed by a regenerable price-preset and a
  full stats/legend reference.
- Live auction: the highest-stakes, most time-pressured usage moment. Currently the
  same desktop-oriented UI (wide multi-column sortable table, budget dashboard,
  formations panel) is used on mobile too, requiring horizontal scroll to reach the
  tracking columns (Fascia/Tgt/Asta) — acceptable for prep, friction-prone live.
- Data refresh cadence: manually re-run every 2–3 days in the run-up to the auction
  (quotazioni requires the maintainer to log in and download an Excel file by hand;
  transfers/injuries/formations refresh without login). This is an operational fact
  about the maintainer's workflow, not an end-user-facing feature.

## Capabilities and Constraints

- Next.js/React web app, no backend, no accounts. All user state (tiers, targets,
  budget config, live tracking) lives in the browser's localStorage, with manual
  JSON backup/restore as the only durability net — nothing syncs across devices.
  A phone-only live-auction mode therefore cannot assume prep done on a laptop is
  "there" unless the same browser/device was used, or the user restores a backup.
- Mantra league format and a "modificatore difesa" scoring toggle exist alongside the
  primary Classic format; both must keep working, though Classic is the default and
  primary use case documented across the project.
- Data is real but has known gaps (new/fringe transfers not yet in the official
  listone, small-sample noise flagged rather than hidden) — the product's stance is to
  surface uncertainty (badges, "—", small-sample flags) rather than mask it.

## Brand Commitments

Name: FantaDraft2027. Existing dark theme and design tokens (`web/app/tool/tool.css`,
`web/app/globals.css`) are the incumbent visual system — not documented in a DESIGN.md
yet, but treated as established authority per the skill's own rules for narrow
extensions of an existing implementation.

## Evidence on Hand

Live production site: https://fantadraft.murruni.it (landing + `/tool`). Full build/
feature history documented chronologically in `/CLAUDE.md` at the repo root (extensive:
every dataset refresh, every UI change, every fix, since the project's start). No
fabricated testimonials, pricing, or customer logos exist or should be invented — this
is a free hobby-turned-community tool, not a commercial product with proof assets.

## Product Principles

1. Transparent over magic: every score/suggestion states its formula in the UI
   (tooltip, legend, or inline), never an opaque black-box number.
2. Prep and live-auction are different jobs: prep tolerates density and depth; live
   tracking must not force the user to hunt across a wide table under time pressure.
3. Surface data uncertainty, don't hide it: small samples, missing stats, and stale
   listone entries get a visible flag, not a silently confident number.
4. No account, no lock-in: state lives in the user's browser; backup/restore is the
   only sync mechanism, by design, not by oversight.
5. Free and open source: no feature should assume or nudge toward payment/signup.

## Accessibility & Inclusion

WCAG 2.1 AA is an established, already-audited bar for this project (contrast, focus
management, keyboard navigation, `aria-*` on interactive elements) — see the 13/08/2026
CLAUDE.md audit-fix entry. Any new surface (including a mobile live-auction mode) must
meet the same bar, not a lighter one.
