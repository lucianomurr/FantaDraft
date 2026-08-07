"use client";

import { useAsta } from "../../contexts/AstaContext";
import type { Role } from "../../lib/types";

const ROLE_TABS: { key: Role | "ALL"; label: string }[] = [
  { key: "ALL", label: "Tutti" },
  { key: "P", label: "Por" },
  { key: "D", label: "Dif" },
  { key: "C", label: "Cen" },
  { key: "A", label: "Att" },
];

export function FilterBar({ teams, count }: { teams: string[]; count: number }) {
  const { filters, setFilters } = useAsta();

  return (
    <div className="controls">
      <div className="tabs">
        {ROLE_TABS.map((t) => (
          <button
            key={t.key}
            className={`tab${filters.role === t.key ? " on" : ""}`}
            onClick={() => setFilters({ role: t.key })}
          >
            {t.label}
          </button>
        ))}
      </div>
      <input
        placeholder="🔎 Cerca nome…"
        style={{ minWidth: 150 }}
        value={filters.q}
        onChange={(e) => setFilters({ q: e.target.value })}
      />
      <select value={filters.team} onChange={(e) => setFilters({ team: e.target.value })}>
        <option value="">Tutte le squadre</option>
        {teams.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <select value={filters.tier} onChange={(e) => setFilters({ tier: e.target.value })}>
        <option value="">Tutte le fasce</option>
        <option value="1">Fascia 1</option>
        <option value="2">Fascia 2</option>
        <option value="3">Fascia 3</option>
        <option value="4">Fascia 4</option>
        <option value="R">Riserva 1cr</option>
        <option value="tiered">Solo con fascia</option>
        <option value="none">Senza fascia</option>
      </select>
      <div className="spacer" />
      <label className="chk">
        <input
          type="checkbox"
          checked={filters.hideOut}
          onChange={(e) => setFilters({ hideOut: e.target.checked })}
        />
        Nascondi presi da altri
      </label>
      <label className="chk">
        <input
          type="checkbox"
          checked={filters.onlyMine}
          onChange={(e) => setFilters({ onlyMine: e.target.checked })}
        />
        Solo miei
      </label>
      <label className="chk">
        <input
          type="checkbox"
          checked={filters.onlyPen}
          onChange={(e) => setFilters({ onlyPen: e.target.checked })}
        />
        ⚽ Solo rigoristi
      </label>
      <label className="chk">
        <input
          type="checkbox"
          checked={filters.onlyTit}
          onChange={(e) => setFilters({ onlyTit: e.target.checked })}
        />
        ● Titolari (maggioranza fonti)
      </label>
      <span className="pill">{count} giocatori</span>
    </div>
  );
}
