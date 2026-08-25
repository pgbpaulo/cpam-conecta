import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar · CPAM Conecta",
  description: "Acesso interno ao CPAM Conecta.",
};

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col bg-canvas-soft lg:flex-row lg:items-stretch">
      {/* Brand panel — lg+ only. Mobile stays the single centered card it
          already was (that's the product's primary usage scene); this panel
          exists to give the wide viewport a composed layout instead of a
          card adrift in empty sage. DESIGN.md's polarity-flipped dark
          surface (hero-band-dark / card-feature-dark): ink background, CPAM
          green reserved for the one headline moment, canvas-soft for body —
          the same pairing the footer already uses on ink. */}
      <div className="hidden shrink-0 flex-col justify-between bg-ink px-12 py-16 lg:flex lg:w-[38%] lg:min-w-[26rem]">
        <span className="text-sm font-semibold text-primary">CPAM Conecta</span>

        <div className="flex flex-col gap-4">
          <h1 className="text-[40px] leading-[34px] font-black text-primary">
            Ceasinha do Morango
          </h1>
          <p className="max-w-[26rem] text-base text-canvas-soft">
            Registro diário do preço da caixa de morango — mínimo e máximo por
            categoria — direto do celular, com confirmação clara de que ficou
            salvo.
          </p>
        </div>

        <span className="text-xs text-canvas-soft">Bom Repouso · MG</span>
      </div>

      <div className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="motion-safe:animate-[login-settle_0.5s_cubic-bezier(0,0.6,0.2,1)_both] w-full max-w-[22rem] rounded-[24px] bg-canvas p-8">
          <div className="mb-8 flex flex-col items-center gap-1.5 text-center lg:hidden">
            <span className="text-2xl leading-[31.2px] font-semibold tracking-[-0.48px] text-ink">
              CPAM Conecta
            </span>
            <span className="text-sm text-body">
              Ceasinha do Morango · acesso interno
            </span>
          </div>
          <div className="mb-8 hidden text-center lg:block">
            <span className="text-2xl leading-[31.2px] font-semibold tracking-[-0.48px] text-ink">
              Entrar
            </span>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
