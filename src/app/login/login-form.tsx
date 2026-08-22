"use client";

import { useActionState, useId } from "react";
import { Loader2 } from "lucide-react";

import { login, type LoginState } from "./actions";

const initialState: LoginState = { status: "idle" };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState);
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  return (
    <form action={formAction} className="flex w-full flex-col gap-6" noValidate>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={emailId}
            className="text-xs font-bold tracking-[0.14em] text-[oklch(0.82_0.02_120)] uppercase"
          >
            E-mail
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            disabled={isPending}
            aria-invalid={state.status === "error" || undefined}
            aria-describedby={state.status === "error" ? errorId : undefined}
            className="h-11 border-0 border-b-2 border-[oklch(0.42_0.02_165)] bg-transparent px-0.5 text-base text-[oklch(0.97_0.01_90)] outline-none transition-colors placeholder:text-[oklch(0.55_0.02_165)] focus:border-[oklch(0.62_0.19_20)] disabled:opacity-50"
            placeholder="voce@ceasinhadomorango.com.br"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={passwordId}
            className="text-xs font-bold tracking-[0.14em] text-[oklch(0.82_0.02_120)] uppercase"
          >
            Senha
          </label>
          <input
            id={passwordId}
            name="password"
            type="password"
            required
            autoComplete="current-password"
            disabled={isPending}
            aria-invalid={state.status === "error" || undefined}
            aria-describedby={state.status === "error" ? errorId : undefined}
            className="h-11 border-0 border-b-2 border-[oklch(0.42_0.02_165)] bg-transparent px-0.5 text-base tracking-widest text-[oklch(0.97_0.01_90)] outline-none transition-colors placeholder:text-[oklch(0.55_0.02_165)] placeholder:tracking-normal focus:border-[oklch(0.62_0.19_20)] disabled:opacity-50"
            placeholder="Sua senha"
          />
        </div>
      </div>

      {state.status === "error" ? (
        <p
          id={errorId}
          role="alert"
          className="relative pt-3 text-sm text-[oklch(0.74_0.19_25)] before:absolute before:top-0 before:left-0 before:h-[2px] before:w-10 before:-rotate-2 before:bg-[oklch(0.74_0.19_25)] before:content-['']"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 bg-[oklch(0.52_0.19_25)] text-sm font-bold tracking-[0.14em] text-[oklch(0.99_0_0)] uppercase transition-[background-color,opacity] hover:bg-[oklch(0.57_0.19_25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.62_0.19_20)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Entrando…
          </>
        ) : (
          "Entrar"
        )}
      </button>
    </form>
  );
}
