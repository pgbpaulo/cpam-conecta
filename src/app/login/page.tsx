import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar · CPAM Conecta",
  description: "Acesso interno ao CPAM Conecta.",
};

// Authored grain, not a decorative filter: a fractal-noise SVG rendered once
// and layered at low opacity so the board reads as a painted, textured
// surface instead of flat CSS pretending to be one (see the OWN-WORLD line
// in the direction contract in the root layout).
const BOARD_GRAIN_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

export default function LoginPage() {
  return (
    <div className="relative flex flex-1 items-center justify-center bg-[oklch(0.22_0.02_165)] px-5 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{ backgroundImage: `url("${BOARD_GRAIN_URL}")` }}
      />
      <div className="motion-safe:animate-[login-settle_0.5s_cubic-bezier(0,0.6,0.2,1)_both] relative w-full max-w-[22rem]">
        <div className="mb-10 flex flex-col items-center gap-1 text-center">
          <span className="text-lg font-bold tracking-[0.14em] text-[oklch(0.97_0.01_90)] uppercase">
            CPAM Conecta
          </span>
          <span className="text-xs tracking-[0.1em] text-[oklch(0.65_0.02_165)] uppercase">
            Ceasinha do Morango · acesso interno
          </span>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
