"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type {
  FilterState,
  PlayerState,
  RoleAllocation,
  SortState,
  Status,
  Tier,
  TrackingState,
} from "../lib/types";
import { DEFAULT_CFG, loadPersisted, savePersisted } from "../lib/storage";
import { generateSyncCode, pullSyncState, pushSyncState, type SyncStatus } from "../lib/sync";

const SYNC_CODE_KEY = "fanta_asta_2627_sync_code";
const SYNC_POLL_MS = 4000;
const SYNC_PUSH_DEBOUNCE_MS = 800;

interface AstaState {
  cfg: RoleAllocation;
  st: TrackingState;
  filters: FilterState;
  sort: SortState;
  hydrated: boolean;
  hadSavedState: boolean;
}

type Action =
  | { type: "HYDRATE"; cfg: RoleAllocation; st: TrackingState; hadSavedState: boolean }
  | { type: "SET_CFG"; cfg: Partial<RoleAllocation> }
  | { type: "SET_TIER"; id: number; tier: Tier | null }
  | { type: "SET_TGT"; id: number; tgt: number | null }
  | { type: "SET_PAID"; id: number; paid: number | null }
  | { type: "SET_STATUS"; id: number; status: Status }
  | { type: "APPLY_COMPUTED_PRESET"; tierMap: Record<number, Tier>; resetFirst: boolean }
  | { type: "RESET_LIVE" }
  | { type: "RESET_ALL" }
  | { type: "IMPORT"; cfg: RoleAllocation; st: TrackingState }
  | { type: "SET_FILTERS"; filters: Partial<FilterState> }
  | { type: "SET_SORT"; sort: SortState };

const initialFilters: FilterState = {
  role: "ALL",
  q: "",
  team: "",
  tier: "",
  hideOut: true,
  onlyMine: false,
  onlyPen: false,
  onlyTit: false,
  mrole: "",
};

const initialState: AstaState = {
  cfg: DEFAULT_CFG,
  st: {},
  filters: initialFilters,
  sort: { key: "f", dir: -1 },
  hydrated: false,
  hadSavedState: false,
};

function ensurePlayerState(st: TrackingState, id: number): PlayerState {
  return st[id] ?? { t: null, tgt: null, s: "free", p: null };
}

function reducer(state: AstaState, action: Action): AstaState {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, cfg: action.cfg, st: action.st, hadSavedState: action.hadSavedState, hydrated: true };
    case "SET_CFG":
      return { ...state, cfg: { ...state.cfg, ...action.cfg } };
    case "SET_TIER": {
      const cur = ensurePlayerState(state.st, action.id);
      const next = String(cur.t) === String(action.tier) ? null : action.tier;
      return { ...state, st: { ...state.st, [action.id]: { ...cur, t: next } } };
    }
    case "SET_TGT": {
      const cur = ensurePlayerState(state.st, action.id);
      return { ...state, st: { ...state.st, [action.id]: { ...cur, tgt: action.tgt } } };
    }
    case "SET_PAID": {
      const cur = ensurePlayerState(state.st, action.id);
      return { ...state, st: { ...state.st, [action.id]: { ...cur, p: action.paid } } };
    }
    case "SET_STATUS": {
      const cur = ensurePlayerState(state.st, action.id);
      const p = action.status !== "mine" ? null : cur.p;
      return { ...state, st: { ...state.st, [action.id]: { ...cur, s: action.status, p } } };
    }
    case "APPLY_COMPUTED_PRESET": {
      let st = state.st;
      if (action.resetFirst) {
        st = {};
        for (const [id, s] of Object.entries(state.st)) {
          st[Number(id)] = { ...s, t: null };
        }
      }
      const next = { ...st };
      for (const [idStr, tier] of Object.entries(action.tierMap)) {
        const id = Number(idStr);
        const cur = ensurePlayerState(next, id);
        if (action.resetFirst || !cur.t) {
          next[id] = { ...cur, t: tier };
        }
      }
      return { ...state, st: next };
    }
    case "RESET_LIVE": {
      const st: TrackingState = {};
      for (const [id, s] of Object.entries(state.st)) {
        st[Number(id)] = { ...s, s: "free", p: null };
      }
      return { ...state, st };
    }
    case "RESET_ALL":
      return { ...state, cfg: DEFAULT_CFG, st: {}, hadSavedState: false };
    case "IMPORT":
      return { ...state, cfg: { ...state.cfg, ...action.cfg }, st: action.st };
    case "SET_FILTERS":
      return { ...state, filters: { ...state.filters, ...action.filters } };
    case "SET_SORT":
      return { ...state, sort: action.sort };
    default:
      return state;
  }
}

interface Toast {
  id: number;
  msg: string;
}

interface AstaContextValue {
  cfg: RoleAllocation;
  st: TrackingState;
  filters: FilterState;
  sort: SortState;
  hydrated: boolean;
  hadSavedState: boolean;
  getPlayerState: (id: number) => PlayerState;
  setCfg: (cfg: Partial<RoleAllocation>) => void;
  setTier: (id: number, tier: Tier) => void;
  setTgt: (id: number, tgt: number | null) => void;
  setPaid: (id: number, paid: number | null) => void;
  setStatus: (id: number, status: Status) => void;
  applyComputedPreset: (tierMap: Record<number, Tier>, resetFirst: boolean) => void;
  resetLive: () => void;
  resetAll: () => void;
  importState: (cfg: RoleAllocation, st: TrackingState) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  setSort: (sort: SortState) => void;
  sortBy: (key: SortState["key"]) => void;
  toast: (msg: string) => void;
  toasts: Toast[];
  syncCode: string | null;
  syncStatus: SyncStatus;
  startSync: (code?: string) => string;
  stopSync: () => void;
}

const AstaCtx = createContext<AstaContextValue | null>(null);

interface TrackingContextValue {
  getPlayerState: (id: number) => PlayerState;
  setTier: (id: number, tier: Tier | null) => void;
  setTgt: (id: number, tgt: number | null) => void;
  setPaid: (id: number, paid: number | null) => void;
  setStatus: (id: number, status: Status) => void;
}

const TrackingCtx = createContext<TrackingContextValue | null>(null);

/** Sottoinsieme di useAsta() con SOLO il tracking per-giocatore (fasce, target,
 * prezzo, stato), memoizzato su state.st invece che sull'intero state. Usato
 * da PlayerRow (renderizzato centinaia di volte) per non ri-renderizzare ogni
 * riga quando cambia un filtro, l'ordinamento o il budget — cose che non
 * toccano state.st e quindi lasciano invariato questo context. */
export function useTracking(): TrackingContextValue {
  const ctx = useContext(TrackingCtx);
  if (!ctx) throw new Error("useTracking must be used within AstaProvider");
  return ctx;
}

export function AstaProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  useEffect(() => {
    const persisted = loadPersisted();
    if (persisted) {
      dispatch({ type: "HYDRATE", cfg: persisted.cfg, st: persisted.st, hadSavedState: true });
    } else {
      dispatch({ type: "HYDRATE", cfg: DEFAULT_CFG, st: {}, hadSavedState: false });
    }
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    savePersisted({ cfg: state.cfg, st: state.st });
  }, [state.hydrated, state.cfg, state.st]);

  // Sync multi-device (modalità "Inizia asta"): codice a 6 cifre condiviso via
  // /api/sync (Upstash, TTL 48h). lastSyncedAtRef è il timestamp del dato più
  // recente che questo device conosce già (pushato o applicato) — evita sia di
  // riapplicare dati vecchi sia di rimandare in loop uno stato appena ricevuto.
  const [syncCode, setSyncCodeState] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const lastSyncedAtRef = useRef(0);
  const suppressNextPushRef = useRef(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(SYNC_CODE_KEY) : null;
    if (saved) setSyncCodeState(saved);
  }, []);

  const startSync = useCallback((code?: string) => {
    const c = code ?? generateSyncCode();
    window.localStorage.setItem(SYNC_CODE_KEY, c);
    setSyncCodeState(c);
    setSyncStatus("connecting");
    lastSyncedAtRef.current = 0;
    return c;
  }, []);

  const stopSync = useCallback(() => {
    window.localStorage.removeItem(SYNC_CODE_KEY);
    setSyncCodeState(null);
    setSyncStatus("idle");
  }, []);

  useEffect(() => {
    if (!syncCode) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const remote = await pullSyncState(syncCode);
        if (cancelled) return;
        if (remote && remote.updatedAt > lastSyncedAtRef.current) {
          lastSyncedAtRef.current = remote.updatedAt;
          suppressNextPushRef.current = true;
          dispatch({ type: "IMPORT", cfg: remote.cfg, st: remote.st });
        }
        setSyncStatus("synced");
      } catch {
        setSyncStatus(navigator.onLine ? "error" : "offline");
      }
    };
    poll();
    const id = setInterval(poll, SYNC_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [syncCode]);

  useEffect(() => {
    if (!syncCode || !state.hydrated) return;
    if (suppressNextPushRef.current) {
      suppressNextPushRef.current = false;
      return;
    }
    const t = setTimeout(() => {
      const updatedAt = Date.now();
      pushSyncState(syncCode, { cfg: state.cfg, st: state.st, updatedAt })
        .then(() => {
          lastSyncedAtRef.current = updatedAt;
          setSyncStatus("synced");
        })
        .catch(() => setSyncStatus(navigator.onLine ? "error" : "offline"));
    }, SYNC_PUSH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [syncCode, state.hydrated, state.cfg, state.st]);

  const toast = useCallback((msg: string) => {
    const id = ++toastIdRef.current;
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 1800);
  }, []);

  const getPlayerState = useCallback(
    (id: number): PlayerState => ensurePlayerState(state.st, id),
    [state.st],
  );

  // Riferimenti stabili (dipendono solo da dispatch/toast, mai da state):
  // condivisi tra AstaContext e TrackingContext così il secondo, memoizzato
  // su state.st, non perde la stabilità quando cambiano filtri/sort/cfg.
  const setTier = useCallback((id: number, tier: Tier | null) => dispatch({ type: "SET_TIER", id, tier }), []);
  const setTgt = useCallback((id: number, tgt: number | null) => dispatch({ type: "SET_TGT", id, tgt }), []);
  const setPaid = useCallback((id: number, paid: number | null) => dispatch({ type: "SET_PAID", id, paid }), []);
  const setStatus = useCallback(
    (id: number, status: Status) => {
      dispatch({ type: "SET_STATUS", id, status });
      if (status === "mine") toast("Preso! Inserisci il prezzo pagato.");
    },
    [toast],
  );

  const trackingValue = useMemo<TrackingContextValue>(
    () => ({ getPlayerState, setTier, setTgt, setPaid, setStatus }),
    [getPlayerState, setTier, setTgt, setPaid, setStatus],
  );

  const value = useMemo<AstaContextValue>(
    () => ({
      cfg: state.cfg,
      st: state.st,
      filters: state.filters,
      sort: state.sort,
      hydrated: state.hydrated,
      hadSavedState: state.hadSavedState,
      getPlayerState,
      setCfg: (cfg) => dispatch({ type: "SET_CFG", cfg }),
      setTier,
      setTgt,
      setPaid,
      setStatus,
      applyComputedPreset: (tierMap, resetFirst) => {
        const ids = Object.keys(tierMap).map(Number);
        const count = resetFirst ? ids.length : ids.filter((id) => !state.st[id]?.t).length;
        if (count === 0) {
          toast("Nessuna fascia da aggiornare con questi parametri (spunta \"azzera\" per sovrascrivere)");
          return;
        }
        dispatch({ type: "APPLY_COMPUTED_PRESET", tierMap, resetFirst });
        toast(
          `Preset applicato a ${count} giocatori` + (resetFirst ? " (fasce azzerate prima)" : ""),
        );
      },
      resetLive: () => {
        dispatch({ type: "RESET_LIVE" });
        toast("Tracking asta azzerato");
      },
      resetAll: () => {
        dispatch({ type: "RESET_ALL" });
        toast("Reset completato");
      },
      importState: (cfg, st) => {
        dispatch({ type: "IMPORT", cfg, st });
        toast("Backup ripristinato");
      },
      setFilters: (filters) => dispatch({ type: "SET_FILTERS", filters }),
      setSort: (sort) => dispatch({ type: "SET_SORT", sort }),
      sortBy: (key) => {
        const dir: 1 | -1 =
          state.sort.key === key ? (state.sort.dir === 1 ? -1 : 1) : key === "n" || key === "s" ? 1 : -1;
        dispatch({ type: "SET_SORT", sort: { key, dir } });
      },
      toast,
      toasts,
      syncCode,
      syncStatus,
      startSync,
      stopSync,
    }),
    [
      state,
      getPlayerState,
      setTier,
      setTgt,
      setPaid,
      setStatus,
      toast,
      toasts,
      syncCode,
      syncStatus,
      startSync,
      stopSync,
    ],
  );

  return (
    <AstaCtx.Provider value={value}>
      <TrackingCtx.Provider value={trackingValue}>{children}</TrackingCtx.Provider>
    </AstaCtx.Provider>
  );
}

export function useAsta(): AstaContextValue {
  const ctx = useContext(AstaCtx);
  if (!ctx) throw new Error("useAsta must be used within AstaProvider");
  return ctx;
}
