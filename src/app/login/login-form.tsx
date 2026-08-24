"use client";

import { useActionState, useId } from "react";
import { CircleAlert, Loader2 } from "lucide-react";

import { login, type LoginState } from "./actions";

const initialState: LoginState = { status: "idle" };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState);
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  return (
    <form action={formAction} className="flex w-full flex-col gap-5" noValidate>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={emailId} className="text-sm text-body">
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
            className="h-12 rounded-[12px] border border-ink bg-canvas px-4 text-base text-ink outline-none transition-shadow placeholder:text-mute focus:ring-2 focus:ring-primary disabled:opacity-50"
            placeholder="voce@ceasinhadomorango.com.br"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={passwordId} className="text-sm text-body">
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
            className="h-12 rounded-[12px] border border-ink bg-canvas px-4 text-base text-ink outline-none transition-shadow placeholder:text-mute focus:ring-2 focus:ring-primary disabled:opacity-50"
            placeholder="Sua senha"
          />
        </div>
      </div>

      {state.status === "error" ? (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-sm text-negative"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[24px] bg-primary text-[16px] font-semibold text-on-primary transition-colors hover:bg-primary-active focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-70"
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
