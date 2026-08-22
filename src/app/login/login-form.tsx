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
            className="text-xs font-bold tracking-[0.14em] text-chalk-label uppercase"
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
            className="h-11 border-0 border-b-2 border-board-rule bg-transparent px-0.5 text-base text-chalk-white outline-none transition-colors placeholder:text-chalk-placeholder focus:border-strawberry-focus disabled:opacity-50"
            placeholder="voce@ceasinhadomorango.com.br"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={passwordId}
            className="text-xs font-bold tracking-[0.14em] text-chalk-label uppercase"
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
            className="h-11 border-0 border-b-2 border-board-rule bg-transparent px-0.5 text-base tracking-widest text-chalk-white outline-none transition-colors placeholder:text-chalk-placeholder placeholder:tracking-normal focus:border-strawberry-focus disabled:opacity-50"
            placeholder="Sua senha"
          />
        </div>
      </div>

      {state.status === "error" ? (
        <p
          id={errorId}
          role="alert"
          className="relative pt-3 text-sm text-board-error before:absolute before:top-0 before:left-0 before:h-[2px] before:w-10 before:-rotate-2 before:bg-board-error before:content-['']"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 bg-strawberry text-sm font-bold tracking-[0.14em] text-strawberry-foreground uppercase transition-[background-color,opacity] hover:bg-strawberry-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-strawberry-focus disabled:cursor-not-allowed disabled:opacity-70"
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
