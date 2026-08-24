"use client";

import { startTransition, useActionState, useId, useMemo, useState } from "react";
import { Check, CircleAlert, Loader2, MoveRight } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  STRAWBERRY_CATEGORIES,
  type CategoryPriceInput,
  type StrawberryCategory,
  type StrawberryPriceFormValues,
} from "@/lib/validation/strawberry-price";
import { savePrices, type SavePricesResult } from "./actions";

// Extends "CPAM Conecta" (see DESIGN.md) rather than inventing a new world:
// category blocks reuse the login form's black-bordered field, the save
// button reuses its lime-green primary pill, and the "already launched"
// indicator reuses recent-days-list's badge-positive vocabulary — none of
// that repeats here as decoration, it is the one component grammar this
// surface already owns.

const CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

type FieldState = { precoMin: string; precoMax: string };
type FieldsState = Record<StrawberryCategory, FieldState>;

function slugify(categoria: StrawberryCategory): string {
  return categoria.toLowerCase().replace(/\s+/g, "-");
}

function toFieldValue(value: number | undefined): string {
  // pt-BR convention: two decimal places, comma as the separator (e.g.
  // "8,50" rather than "8.5"), matching what parsePrice below accepts back
  // in and what a pt-BR phone keyboard types.
  return value === undefined ? "" : value.toFixed(2).replace(".", ",");
}

function buildFieldsState(
  initialValues: Record<StrawberryCategory, CategoryPriceInput>
): FieldsState {
  const state = {} as FieldsState;
  for (const categoria of STRAWBERRY_CATEGORIES) {
    state[categoria] = {
      precoMin: toFieldValue(initialValues[categoria]?.precoMin),
      precoMax: toFieldValue(initialValues[categoria]?.precoMax),
    };
  }
  return state;
}

function parsePrice(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  // A pt-BR phone keyboard's decimal key types "," not ".", so accept a
  // comma decimal separator here (e.g. "8,50") before parsing.
  const normalized = trimmed.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function StrawberryPriceForm({
  date,
  initialValues,
}: {
  date: string;
  initialValues: Record<StrawberryCategory, CategoryPriceInput>;
}) {
  const [result, formAction, isPending] = useActionState<
    SavePricesResult | null,
    StrawberryPriceFormValues
  >(savePrices, null);

  const [fields, setFields] = useState<FieldsState>(() => buildFieldsState(initialValues));

  // "Já lançado" starts from what the day had on load, then folds in whatever
  // the most recent successful save just created — computed, not stored, so
  // there is no render-phase setState to get wrong.
  const launchedCategories = useMemo(() => {
    const set = new Set<StrawberryCategory>(
      STRAWBERRY_CATEGORIES.filter((categoria) => initialValues[categoria]?.precoMin !== undefined)
    );
    if (result?.status === "success") {
      for (const entry of result.entries) set.add(entry.categoria);
    }
    return set;
  }, [initialValues, result]);

  const dateFieldId = useId();
  const idBase = useId();
  const feedbackId = useId();

  function updateField(
    categoria: StrawberryCategory,
    kind: "precoMin" | "precoMax",
    value: string
  ) {
    setFields((current) => ({
      ...current,
      [categoria]: { ...current[categoria], [kind]: value },
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const precos = {} as Record<StrawberryCategory, CategoryPriceInput>;
    for (const categoria of STRAWBERRY_CATEGORIES) {
      precos[categoria] = {
        precoMin: parsePrice(fields[categoria].precoMin),
        precoMax: parsePrice(fields[categoria].precoMax),
      };
    }

    startTransition(() => {
      formAction({ data: date, precos });
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <form method="get" action="/admin/lancar-preco" className="flex flex-col gap-1.5">
        <label htmlFor={dateFieldId} className="text-sm text-body">
          Data
        </label>
        <div className="flex items-center gap-3">
          <input
            id={dateFieldId}
            name="data"
            type="date"
            defaultValue={date}
            disabled={isPending}
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
            className="h-12 min-w-0 flex-1 rounded-[12px] border border-ink bg-canvas px-4 text-base text-ink outline-none transition-shadow focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-[12px] border border-ink bg-canvas px-4 text-sm font-semibold text-ink transition-colors hover:bg-canvas-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50"
          >
            Ver
            <MoveRight className="size-3.5" aria-hidden />
          </button>
        </div>
      </form>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
        <div className="flex flex-col">
          {STRAWBERRY_CATEGORIES.map((categoria) => {
            const isLaunched = launchedCategories.has(categoria);
            const slug = slugify(categoria);
            const minId = `${idBase}-${slug}-min`;
            const maxId = `${idBase}-${slug}-max`;
            const categoryError =
              result?.status === "validation-error" ? result.fieldErrors?.[categoria] : undefined;

            return (
              <div
                key={categoria}
                className="flex flex-col gap-4 border-b border-canvas-soft py-5 first:pt-0 last:border-b-0"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[16px] font-semibold text-ink">{categoria}</span>
                  {isLaunched ? (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary-pale px-2.5 py-1 text-xs font-semibold text-positive-deep">
                      <Check className="size-3.5" aria-hidden />
                      Lançado
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs text-mute">Sem lançamento</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={minId} className="text-sm text-body">
                      Preço mínimo
                    </label>
                    <input
                      id={minId}
                      type="text"
                      inputMode="decimal"
                      disabled={isPending}
                      value={fields[categoria].precoMin}
                      onChange={(event) => updateField(categoria, "precoMin", event.target.value)}
                      placeholder="0,00"
                      className="h-12 w-full rounded-[12px] border border-ink bg-canvas px-4 text-base text-ink outline-none transition-shadow placeholder:text-mute focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={maxId} className="text-sm text-body">
                      Preço máximo
                    </label>
                    <input
                      id={maxId}
                      type="text"
                      inputMode="decimal"
                      disabled={isPending}
                      value={fields[categoria].precoMax}
                      onChange={(event) => updateField(categoria, "precoMax", event.target.value)}
                      placeholder="0,00"
                      className="h-12 w-full rounded-[12px] border border-ink bg-canvas px-4 text-base text-ink outline-none transition-shadow placeholder:text-mute focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                  </div>
                </div>

                {categoryError ? (
                  <p role="alert" className="flex items-start gap-1.5 text-sm text-negative">
                    <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {categoryError}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[24px] bg-primary text-[16px] font-semibold text-on-primary transition-colors hover:bg-primary-active focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Salvando…
            </>
          ) : (
            "Salvar preços"
          )}
        </button>

        {result && result.status !== "success" ? (
          <p role="alert" id={feedbackId} className="flex items-start gap-1.5 text-sm text-negative">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {result.message}
          </p>
        ) : null}

        {result && result.status === "success" ? (
          <div id={feedbackId} role="status" className="flex flex-col gap-3">
            <p className="text-sm text-body">
              Preços salvos às {TIME_FORMATTER.format(new Date(result.savedAt))}
            </p>
            <ul className="flex flex-col">
              {result.entries.map((entry) => (
                <li
                  key={entry.categoria}
                  className="flex items-center justify-between gap-3 border-b border-canvas-soft py-2.5 last:border-b-0"
                >
                  <span className="flex items-center gap-2 text-sm text-ink">
                    <Check className="size-3.5 shrink-0 text-positive" aria-hidden />
                    {entry.categoria}
                  </span>
                  <span className="flex items-baseline gap-2 text-sm text-ink">
                    {CURRENCY_FORMATTER.format(entry.precoMin)} –{" "}
                    {CURRENCY_FORMATTER.format(entry.precoMax)}
                    <span className="rounded-full bg-primary-pale px-2 py-0.5 text-xs font-semibold text-positive-deep">
                      {entry.wasUpdate ? "Atualizado" : "Novo"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </form>
    </div>
  );
}
