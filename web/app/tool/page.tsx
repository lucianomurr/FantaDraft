"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import playersRaw from "../../data/players.json";
import formazioniRaw from "../../data/formazioni.json";
import meta from "../../data/meta.json";
import type { Player, FormazioniData } from "../../lib/types";
import { withDerivedAll } from "../../lib/scoring";
import { filterPlayers, sortPlayers } from "../../lib/filters";
import { AstaProvider, useAsta } from "../../contexts/AstaContext";
import { Header } from "../../components/tool/Header";
import { BudgetPanel } from "../../components/tool/BudgetPanel";
import { StrategiaPromemoria } from "../../components/tool/StrategiaPromemoria";
import { ProbabiliFormazioni } from "../../components/tool/ProbabiliFormazioni";
import { FilterBar } from "../../components/tool/FilterBar";
import { PlayersTable } from "../../components/tool/PlayersTable";
import { PlayerCardModal } from "../../components/tool/PlayerCardModal";
import { LegendModal } from "../../components/tool/LegendModal";
import { PresetModal } from "../../components/tool/PresetModal";
import { OnboardingModal } from "../../components/tool/OnboardingModal";
import { ToastHost } from "../../components/tool/ToastHost";

const PLAYERS = playersRaw as unknown as Player[];
const FORMS = formazioniRaw as unknown as FormazioniData;
const TEAMS = [...new Set(PLAYERS.map((p) => p.s))].sort();
const UPDATED_AT = new Date(meta.aggiornato).toLocaleDateString("it-IT", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default function ToolPage() {
  return (
    <AstaProvider>
      <ToolInner />
    </AstaProvider>
  );
}

function ToolInner() {
  const { cfg, st, filters, sort, hydrated, hadSavedState, toast } = useAsta();
  const derived = useMemo(() => withDerivedAll(PLAYERS, cfg.mantra), [cfg.mantra]);
  const numFormSources = FORMS.sources.length;

  const visible = useMemo(() => {
    const filtered = filterPlayers(derived, st, filters, numFormSources);
    return sortPlayers(filtered, sort);
  }, [derived, st, filters, sort, numFormSources]);

  const [legendOpen, setLegendOpen] = useState(false);
  const [presetOpen, setPresetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const onboardingShown = useRef(false);
  const prevHadSavedState = useRef<boolean | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    // "Reset totale" riporta hadSavedState a false: riarma l'onboarding come a un primo avvio.
    if (prevHadSavedState.current === true && !hadSavedState) {
      onboardingShown.current = false;
    }
    prevHadSavedState.current = hadSavedState;
    if (!hadSavedState && !onboardingShown.current) {
      onboardingShown.current = true;
      setOnboardingOpen(true);
    }
  }, [hydrated, hadSavedState]);

  const selectedPlayer = useMemo(
    () => (selectedId != null ? (derived.find((p) => p.id === selectedId) ?? null) : null),
    [derived, selectedId],
  );

  const openCard = useCallback(
    (id: number) => {
      const p = derived.find((x) => x.id === id);
      if (!p) return;
      if (!p.stat) {
        toast(`Nessun dato per ${p.n} — esordiente/scommessa 🎲`);
        return;
      }
      setSelectedId(id);
    },
    [derived, toast],
  );

  if (!hydrated) return null;

  return (
    <div className="tool-wrap">
      <Header
        onShowLegend={() => setLegendOpen(true)}
        onShowPreset={() => setPresetOpen(true)}
        updatedAt={UPDATED_AT}
      />

      <BudgetPanel players={PLAYERS} />

      <StrategiaPromemoria />
      <ProbabiliFormazioni forms={FORMS} />

      <FilterBar teams={TEAMS} count={visible.length} />

      <PlayersTable
        players={visible}
        numFormSources={numFormSources}
        onOpenCard={openCard}
        mantra={cfg.mantra}
      />

      <div className="foot">
        I dati vengono salvati automaticamente nel tuo browser. Usa <b>Backup</b> per esportare
        un file di sicurezza prima dell&apos;asta. · {PLAYERS.length} giocatori — Quotazioni
        ufficiali 2026/27 · Fonti: quotazioni e infortunati fantacalcio.it · statistiche FBref
        (Sports Reference) · xG/xA Understat · formazioni SOS Fanta, FantaMaster, Eurosport,
        Goal, Gazzetta, Fantacalcio.it · rigoristi Gazzetta — progetto amatoriale gratuito non
        affiliato alle testate citate
      </div>

      <PlayerCardModal
        player={selectedPlayer}
        numFormSources={numFormSources}
        allPlayers={derived}
        onClose={() => setSelectedId(null)}
        onOpenCard={openCard}
      />
      <LegendModal open={legendOpen} onClose={() => setLegendOpen(false)} />
      <PresetModal players={PLAYERS} open={presetOpen} onClose={() => setPresetOpen(false)} />
      <OnboardingModal
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onOpenPreset={() => setPresetOpen(true)}
      />
      <ToastHost />
    </div>
  );
}
