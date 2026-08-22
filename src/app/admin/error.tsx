"use client";

import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";

// A new state inside the established board (see DESIGN.md), not a new
// surface: same ground, same chalk type, no card chrome. Board Error is
// spent here deliberately — this is the one state DESIGN.md reserves it
// for, an actual failure, not "Sem lançamento"'s neutral chalk-placeholder.
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-5 py-16 text-center">
      <TriangleAlert className="size-8 text-board-error" aria-hidden />

      <div className="flex flex-col items-center gap-2">
        <p className="relative pt-3 text-base text-chalk-white before:absolute before:top-0 before:left-1/2 before:h-[2px] before:w-10 before:-translate-x-1/2 before:-rotate-2 before:bg-board-error before:content-['']">
          Algo deu errado.
        </p>
        <p className="text-sm text-chalk-subtitle">Tente novamente.</p>
      </div>

      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex h-12 items-center gap-2 bg-strawberry px-6 text-sm font-bold tracking-[0.14em] text-strawberry-foreground uppercase transition-colors hover:bg-strawberry-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-strawberry-focus"
      >
        <RotateCcw className="size-4" aria-hidden />
        Tentar novamente
      </button>
    </div>
  );
}
