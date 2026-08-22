"use client";

import { useActionState, useId, useMemo, useState } from "react";
import { Check, Loader2, MoveRight } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  STRAWBERRY_CATEGORIES,
  type CategoryPriceInput,
  type StrawberryCategory,
  type StrawberryPriceFormValues,
} from "@/lib/validation/strawberry-price";
import { savePrices, type SavePricesResult } from "./actions";

// Extends "The Entreposto Board" (see DESIGN.md) rather than inventing a new
// world: category blocks reuse the login form's ruled-row field, the save
// button reuses its strawberry primary button, and the "already launched"
// indicator reuses recent-days-list's Lançado/Sem-lançamento vocabulary
// (chalk-subtitle + Check vs board-error text) — none of that repeats here
// as decoration, it is the one component grammar this surface already owns.

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
  return value === undefined ? "" : String(value);
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
  const parsed = Number(trimmed);
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

    formAction({ data: date, precos });
  }

  return (
    <div className="flex flex-col gap-10 px-5 py-6">
      <form method="get" action="/admin/lancar-preco" className="flex flex-col gap-1.5">
        <label
          htmlFor={dateFieldId}
          className="text-xs font-bold tracking-[0.14em] text-chalk-label uppercase"
        >
          Data
        </label>
        <div className="flex items-end gap-3">
          <input
            id={dateFieldId}
            name="data"
            type="date"
            defaultValue={date}
            disabled={isPending}
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
            className="h-11 min-w-0 flex-1 border-0 border-b-2 border-board-rule bg-transparent px-0.5 text-base text-chalk-white outline-none transition-colors focus:border-strawberry-focus disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 border-b-2 border-transparent text-xs font-bold tracking-[0.14em] text-chalk-label uppercase transition-colors hover:text-chalk-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-strawberry-focus disabled:opacity-50"
          >
            Ver
            <MoveRight className="size-3.5" aria-hidden />
          </button>
        </div>
      </form>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-10">
        <div className="flex flex-col">
          {STRAWBERRY_CATEGORIES.map((categoria) => {
            const isLaunched = launchedCategories.has(categoria);
            const slug = slugify(categoria);
            const minId = `${idBase}-${slug}-min`;
            const maxId = `${idBase}-${slug}-max`;

            return (
              <div
                key={categoria}
                className="flex flex-col gap-4 border-b border-board-rule py-5 first:pt-0 last:border-b-0"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-bold tracking-[0.1em] text-chalk-white uppercase">
                    {categoria}
                  </span>
                  <span
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 text-xs font-bold tracking-[0.1em] uppercase",
                      isLaunched ? "text-chalk-subtitle" : "text-board-error"
                    )}
                  >
                    {isLaunched ? (
                      <>
                        <Check className="size-3.5" aria-hidden />
                        Lançado
                      </>
                    ) : (
                      "Sem lançamento"
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor={minId}
                      className="text-xs font-bold tracking-[0.14em] text-chalk-label uppercase"
                    >
                      Preço mínimo
                    </label>
                    <input
                      id={minId}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      disabled={isPending}
                      value={fields[categoria].precoMin}
                      onChange={(event) => updateField(categoria, "precoMin", event.target.value)}
                      placeholder="0,00"
                      className="h-11 w-full border-0 border-b-2 border-board-rule bg-transparent px-0.5 text-base text-chalk-white outline-none transition-colors placeholder:text-chalk-placeholder focus:border-strawberry-focus disabled:opacity-50"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor={maxId}
                      className="text-xs font-bold tracking-[0.14em] text-chalk-label uppercase"
                    >
                      Preço máximo
                    </label>
                    <input
                      id={maxId}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      disabled={isPending}
                      value={fields[categoria].precoMax}
                      onChange={(event) => updateField(categoria, "precoMax", event.target.value)}
                      placeholder="0,00"
                      className="h-11 w-full border-0 border-b-2 border-board-rule bg-transparent px-0.5 text-base text-chalk-white outline-none transition-colors placeholder:text-chalk-placeholder focus:border-strawberry-focus disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-12 w-full items-center justify-center gap-2 bg-strawberry text-sm font-bold tracking-[0.14em] text-strawberry-foreground uppercase transition-[background-color,opacity] hover:bg-strawberry-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-strawberry-focus disabled:cursor-not-allowed disabled:opacity-70"
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
          <p
            id={feedbackId}
            role="alert"
            className="relative pt-3 text-sm text-board-error before:absolute before:top-0 before:left-0 before:h-[2px] before:w-10 before:-rotate-2 before:bg-board-error before:content-['']"
          >
            {result.message}
          </p>
        ) : null}

        {result && result.status === "success" ? (
          <div id={feedbackId} role="status" className="flex flex-col gap-3">
            <p className="text-xs font-bold tracking-[0.14em] text-chalk-label uppercase">
              Preços salvos às {TIME_FORMATTER.format(new Date(result.savedAt))}
            </p>
            <ul className="flex flex-col">
              {result.entries.map((entry) => (
                <li
                  key={entry.categoria}
                  className="flex items-center justify-between gap-3 border-b border-board-rule py-2.5 last:border-b-0"
                >
                  <span className="flex items-center gap-2 text-sm text-chalk-white">
                    <Check className="size-3.5 shrink-0 text-chalk-subtitle" aria-hidden />
                    {entry.categoria}
                  </span>
                  <span className="flex items-baseline gap-2 text-sm text-chalk-white">
                    {CURRENCY_FORMATTER.format(entry.precoMin)} –{" "}
                    {CURRENCY_FORMATTER.format(entry.precoMax)}
                    <span className="text-xs font-bold tracking-[0.1em] text-chalk-subtitle uppercase">
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
