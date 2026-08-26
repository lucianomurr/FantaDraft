import type { Metadata, Viewport } from "next";
import { Barlow_Condensed } from "next/font/google";
import Script from "next/script";
import { UpdateBanner } from "../components/UpdateBanner";
import "./globals.css";

const display = Barlow_Condensed({
  weight: ["600", "700"],
  subsets: ["latin"],
  variable: "--font-display",
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://fantadraft.murruni.it";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "FantaDraft2027 — Tool gratuito per l'asta del fantacalcio 2026/27",
  description:
    "Prepara l'asta del fantacalcio Serie A 2026/27 coi numeri: quotazioni e FVM, statistiche FBref e Understat (xG/xA), probabili formazioni da 6 fonti, rigoristi, infortunati, indice di convenienza. Gratuito, open source, senza registrazione.",
  keywords: [
    "fantacalcio", "asta fantacalcio", "fantacalcio 2026/27", "listone fantacalcio",
    "tool asta fantacalcio", "probabili formazioni", "rigoristi serie a", "xG fantacalcio",
  ],
  openGraph: {
    title: "FantaDraft2027 — arriva all'asta coi numeri",
    description:
      "Tool gratuito e open source per l'asta del fantacalcio Serie A 2026/27: statistiche reali, 6 fonti di formazioni, rigoristi, infortunati, budget live.",
    type: "website",
    locale: "it_IT",
    url: SITE,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f1420",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={display.variable}>
      <body>
        {/*
          THESIS: la landing dimostra il meccanismo — la dashboard budget del tool,
          coi numeri veri che si compongono — invece del solito hero screenshot+claim.
          OWN-WORLD: il mondo del tool stesso: notte da asta, pannelli #171d2b su fondo
          #0f1420, righe sottili #2a3346, accenti blu #4f8cff / verde #38d39f, display
          Barlow Condensed maiuscolo da scoreboard, numeri tabulari.
          STORY: il fantallenatore capisce in un viewport che questo è il SUO cruscotto
          d'asta, vede le fonti dati vere, apre il tool; l'email è un favore, non un pedaggio.
          FIRST VIEWPORT: brand, H1 due righe, sub, le 5 card budget (P35/D75/C105/A285/500)
          con count-up e barre che si riempiono, CTA "Apri il tool" + GitHub.
          FORM: candidato 5 della lista ordinata ("la dashboard racconta"), seed 788fc651.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the
          finish review, the verdict, and DESIGN.md.
        */}
        {GA_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        ) : null}
        {children}
        <UpdateBanner />
      </body>
    </html>
  );
}
