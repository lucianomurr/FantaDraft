"use client";

import { useEffect, useRef } from "react";

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  /** Nome accessibile della dialog (screen reader) — non deve necessariamente
   * ripetere il testo visivo, ma di solito coincide col titolo mostrato. */
  title: string;
  children: React.ReactNode;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Overlay + card comuni a scheda giocatore, legenda, onboarding e preset.
 * Chiude su Esc o click fuori dalla card. Dialog accessibile: focus al primo
 * elemento interno all'apertura, Tab intrappolato dentro la card, focus
 * restituito all'elemento che l'aveva aperta alla chiusura. */
export function ModalShell({ open, onClose, title, children }: ModalShellProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    prevFocus.current = document.activeElement as HTMLElement | null;
    const card = cardRef.current;
    const firstFocusable = card?.querySelector<HTMLElement>(FOCUSABLE);
    (firstFocusable ?? card)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !card) return;
      const focusables = Array.from(card.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prevFocus.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modalbg on"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pcard" ref={cardRef} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}
