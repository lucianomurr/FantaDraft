"use client";

import { useEffect, useState } from "react";

const CURRENT_SHA = process.env.NEXT_PUBLIC_BUILD_SHA || "";
const CHECK_MS = 120000;

export function UpdateBanner() {
  const [stale, setStale] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!CURRENT_SHA) return; // dev locale: nessuna sha di build, niente da confrontare

    const check = () => {
      fetch("/api/version", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (d.sha && d.sha !== CURRENT_SHA) setStale(true);
        })
        .catch(() => {});
    };

    check();
    const interval = setInterval(check, CHECK_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (!stale) return null;

  return (
    <div className="updatebanner" role="status">
      <span>Nuova versione disponibile</span>
      <button type="button" onClick={() => window.location.reload()}>
        Aggiorna
      </button>
    </div>
  );
}
