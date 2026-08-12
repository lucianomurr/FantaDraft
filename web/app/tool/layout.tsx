import type { Metadata } from "next";
import "./tool.css";

export const metadata: Metadata = {
  title: "FantaDraft2027 — Tool Strategico Asta Fantacalcio",
  description:
    "Tool gratuito per l'asta del fantacalcio Serie A 2026/27: statistiche reali, xG/xA, probabili formazioni da 6 fonti, rigoristi, infortunati, budget live.",
  alternates: { canonical: "/tool" },
};

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
