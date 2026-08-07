import type { TransferEvent } from "./types";

const TYPE_LABEL: Record<string, string> = {
  Transfer: "trasferimento",
  Loan: "prestito",
  Free: "svincolo",
  "Free agent": "svincolato",
  "Return from loan": "rientro da prestito",
  "N/A": "dettagli non noti",
};

export function transferTypeLabel(type: string): string {
  return TYPE_LABEL[type] ?? type.toLowerCase();
}

/** "2026-07-29" -> "29/07". */
export function formatTransferDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export function transferTooltip(t: TransferEvent, playerTeam: string): string {
  const when = formatTransferDate(t.date);
  const type = transferTypeLabel(t.type);
  if (t.dir === "in") {
    return `Arrivato da ${t.from} il ${when} (${type})`;
  }
  return `Il listone lo ha ancora a ${playerTeam}, ma risulta ceduto a ${t.to} il ${when} (${type}) — verifica prima di puntarci`;
}
