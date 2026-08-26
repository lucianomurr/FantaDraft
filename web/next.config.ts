import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sha del commit deployato (Vercel la imposta da sola in build, nessun
  // setup manuale) — usata dal banner "nuova versione disponibile" per
  // confrontare cosa ha caricato il tab con cosa serve /api/version adesso.
  env: {
    NEXT_PUBLIC_BUILD_SHA: process.env.VERCEL_GIT_COMMIT_SHA || "",
  },
};

export default nextConfig;
