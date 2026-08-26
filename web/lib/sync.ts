import type { PersistedState } from "./types";

export type SyncStatus = "idle" | "connecting" | "synced" | "error" | "offline";

export interface SyncPayload {
  cfg: PersistedState["cfg"];
  st: PersistedState["st"];
  updatedAt: number;
}

/** Codice a 6 cifre, digitabile da tastierino numerico su mobile. */
export function generateSyncCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function pushSyncState(code: string, payload: SyncPayload): Promise<void> {
  const res = await fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, ...payload }),
  });
  if (!res.ok) throw new Error(`sync push failed: ${res.status}`);
}

export async function pullSyncState(code: string): Promise<SyncPayload | null> {
  const res = await fetch(`/api/sync?code=${encodeURIComponent(code)}`);
  if (!res.ok) throw new Error(`sync pull failed: ${res.status}`);
  const data = await res.json();
  return data.state ?? null;
}
