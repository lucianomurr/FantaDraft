"use client";

import { useAsta } from "../../contexts/AstaContext";

export function ToastHost() {
  const { toasts } = useAsta();
  const last = toasts[toasts.length - 1];
  if (!last) return <div className="toast" />;
  return <div className="toast show">{last.msg}</div>;
}
