"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useId,
  useMemo,
  useState,
  useTransition,
} from "react";
import { Check, CircleAlert, Loader2, MoveRight, Palmtree } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  STRAWBERRY_CATEGORIES,
  type CategoryPriceInput,
  type StrawberryCategory,
  type StrawberryPriceFormValues,
} from "@/lib/validation/strawberry-price";
import { savePrices, markHoliday, unmarkHoliday, type SavePricesResult } from "./actions";
import { UNSAVED_CHANGES_MESSAGE, useUnsavedChanges } from "./unsaved-changes-context";
import { STRAWBERRY_CATEGORY_COLOR } from "@/lib/strawberry-category-colors";

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

const DATE_FIELD_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function parseISODate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

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
  isHoliday,
}: {
  date: string;
  initialValues: Record<StrawberryCategory, CategoryPriceInput>;
  isHoliday: boolean;
}) {
  const [result, formAction, isPending] = useActionState<
    SavePricesResult | null,
    StrawberryPriceFormValues
  >(savePrices, null);

  const [fields, setFields] = useState<FieldsState>(() => buildFieldsState(initialValues));
  const { setIsDirty } = useUnsavedChanges();

  // What the day last had confirmed-saved: the initial load, then whatever
  // was typed at the moment of the most recent successful save. Compared
  // against `fields` below to know whether the user has typed something
  // that hasn't made it to the server yet.
  const [savedFields, setSavedFields] = useState<FieldsState>(() => buildFieldsState(initialValues));

  // React's documented pattern for adjusting state from a prop/state change
  // during render (not in an effect): compare against the previous `result`
  // and, on a fresh success, fold the just-saved fields into `savedFields`
  // in the same render pass, before `isDirty` below reads it.
  const [prevResult, setPrevResult] = useState(result);
  if (result !== prevResult) {
    setPrevResult(result);
    if (result?.status === "success") {
      setSavedFields(fields);
    }
  }

  const isDirty = useMemo(() => {
    return STRAWBERRY_CATEGORIES.some((categoria) => {
      const saved = savedFields[categoria];
      const current = fields[categoria];
      return current.precoMin !== saved.precoMin || current.precoMax !== saved.precoMax;
    });
  }, [fields, savedFields]);

  useEffect(() => {
    setIsDirty(isDirty);
  }, [isDirty, setIsDirty]);

  useEffect(() => {
    if (!isDirty) return;
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      // Legacy browsers require a truthy returnValue to show their own
      // "changes may not be saved" prompt; the string itself is never shown.
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

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

  const [holidayPending, startHolidayTransition] = useTransition();
  const [holidayError, setHolidayError] = useState<string | null>(null);

  function handleMarkHoliday() {
    const confirmed = window.confirm(
      `Marcar ${DATE_FIELD_FORMATTER.format(parseISODate(date))} como feriado? Não será possível lançar preços nesse dia.`
    );
    if (!confirmed) return;

    setHolidayError(null);
    startHolidayTransition(async () => {
      const result = await markHoliday(date);
      if (result.status === "error") setHolidayError(result.message);
    });
  }

  function handleUnmarkHoliday() {
    setHolidayError(null);
    startHolidayTransition(async () => {
      const result = await unmarkHoliday(date);
      if (result.status === "error") setHolidayError(result.message);
    });
  }

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
          <div className="relative min-w-0 flex-1">
            {/* The native picker's displayed value follows the browser's
                locale, not this document's lang="pt-BR" (a platform
                limitation — no markup/CSS can redirect it), so it can show
                MM/DD/YYYY on an en-* browser even here. Keep the native
                input as the real control (picker, keyboard input,
                connectivity-light), but hide its own text and lay a
                pt-BR-formatted, non-interactive read-out on top instead —
                clicks still pass through to the native input beneath it. */}
            <input
              id={dateFieldId}
              name="data"
              type="date"
              defaultValue={date}
              disabled={isPending}
              onChange={(event) => {
                const input = event.currentTarget;
                if (isDirty && !window.confirm(UNSAVED_CHANGES_MESSAGE)) {
                  input.value = date;
                  return;
                }
                input.form?.requestSubmit();
              }}
              className="h-12 w-full rounded-[12px] border border-ink bg-canvas px-4 text-base text-transparent outline-none transition-shadow focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-y-0 left-4 flex items-center text-base text-ink",
                isPending && "opacity-50"
              )}
            >
              {DATE_FIELD_FORMATTER.format(parseISODate(date))}
            </span>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-12 shrink-0 cursor-pointer items-center gap-1.5 rounded-[12px] border border-ink bg-canvas px-4 text-sm font-semibold text-ink transition-colors hover:bg-canvas-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            Ver
            <MoveRight className="size-3.5" aria-hidden />
          </button>
        </div>
      </form>

      {isHoliday ? (
        <div className="flex flex-col items-center gap-4 rounded-[24px] bg-canvas-soft px-6 py-12 text-center">
          <Palmtree className="size-10 text-ink" aria-hidden />
          <div className="flex flex-col gap-1.5">
            <p className="text-[16px] font-semibold text-ink">Feriado</p>
            <p className="text-sm text-body">
              Esse dia está marcado como feriado. Não há lançamento de preços.
            </p>
          </div>
          <button
            type="button"
            disabled={holidayPending}
            onClick={handleUnmarkHoliday}
            className="inline-flex h-12 cursor-pointer items-center gap-1.5 rounded-[12px] border border-ink bg-canvas px-4 text-sm font-semibold text-ink transition-colors hover:bg-canvas-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {holidayPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Desmarcando…
              </>
            ) : (
              "Desmarcar feriado"
            )}
          </button>
          {holidayError ? (
            <p role="alert" className="flex items-center gap-1.5 text-sm text-negative">
              <CircleAlert className="size-4 shrink-0" aria-hidden />
              {holidayError}
            </p>
          ) : null}
        </div>
      ) : (
        <>
          {launchedCategories.size === 0 ? (
            <div className="flex flex-col gap-2 self-start">
              <button
                type="button"
                disabled={holidayPending}
                onClick={handleMarkHoliday}
                className="inline-flex w-fit cursor-pointer items-center gap-1.5 text-sm font-semibold text-body transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Palmtree className="size-4" aria-hidden />
                {holidayPending ? "Marcando…" : "Marcar como feriado"}
              </button>
              {holidayError ? (
                <p role="alert" className="flex items-center gap-1.5 text-sm text-negative">
                  <CircleAlert className="size-4 shrink-0" aria-hidden />
                  {holidayError}
                </p>
              ) : null}
            </div>
          ) : null}

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
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: STRAWBERRY_CATEGORY_COLOR[categoria] }}
                        />
                        <span className="text-[16px] font-semibold text-ink">{categoria}</span>
                      </span>
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
              className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-[24px] bg-primary text-[16px] font-semibold text-on-primary transition-colors hover:bg-primary-active focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-70"
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
        </>
      )}
    </div>
  );
}
