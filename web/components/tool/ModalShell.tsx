"use client";

import { useEffect } from "react";

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/** Overlay + card comuni a scheda giocatore, legenda e onboarding. Chiude su
 * Esc o click fuori dalla card. */
export function ModalShell({ open, onClose, children }: ModalShellProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modalbg on"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pcard">{children}</div>
    </div>
  );
}
