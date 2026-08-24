import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// CPAM Sans (see DESIGN.md) is a proprietary-style choice; Inter at weight
// 900 is the documented free substitute for the heavy display voice, paired
// with Inter 600 for sub-heads and 400 for body/UI — one family, three
// weights, per DESIGN.md's Typography > Note on Font Substitutes.
const inter = Inter({
  variable: "--font-geist-sans",
  weight: ["400", "600", "900"],
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CPAM Conecta",
  description: "Painel interno do Ceasinha do Morango para lançar o preço diário da caixa de morango.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/*
          THESIS: Replace the cream/charcoal system with CPAM Conecta's own
          Scandinavian-fintech-inspired world — a lime-green primary carried
          only by real actions, sage canvas, heavy-weight headings.
          OWN-WORLD: canvas-soft #e8ebe6 page ground, canvas #ffffff cards
          (rounded-[24px], no border — surface contrast IS elevation), ink
          #0e0f0c type, primary #9fe870 on every button-primary/nav-indicator,
          Inter 900 for the per-page heading, 600 for nav/labels, 400 body.
          STORY: funcionária/dono opens /admin on a phone, scans status via
          badge-positive pills, edits a black-bordered field, saves on one
          lime-green pill button with one confirmation.
          FIRST VIEWPORT: white nav bar over a sage page, price form as a
          white card, category rows ruled, full-width lime-green save pill.
          FORM: direct retheme of the established structure onto a second
          user-supplied DESIGN.md token set (adapted from a Wise-inspired
          reference kept at wise/DESIGN.md) — Operate mode, brief-pinned
          direction, no concept-seed roll.
          FINISH: unreviewed and undocumented is unfinished; this build ends
          with the finish review, the verdict, DESIGN.md, and every shipping
          raster carrying its provenance.
        */}
        {children}
      </body>
    </html>
  );
}
