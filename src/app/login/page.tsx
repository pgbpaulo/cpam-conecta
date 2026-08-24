import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar · CPAM Conecta",
  description: "Acesso interno ao CPAM Conecta.",
};

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-canvas-soft px-5 py-16">
      <div className="motion-safe:animate-[login-settle_0.5s_cubic-bezier(0,0.6,0.2,1)_both] w-full max-w-[22rem] rounded-[24px] bg-canvas p-8">
        <div className="mb-8 flex flex-col items-center gap-1.5 text-center">
          <span className="text-2xl leading-[31.2px] font-semibold tracking-[-0.48px] text-ink">
            CPAM Conecta
          </span>
          <span className="text-sm text-body">
            Ceasinha do Morango · acesso interno
          </span>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
