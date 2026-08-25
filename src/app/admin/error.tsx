"use client";

import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";

// A new state inside the established CPAM Conecta world (see DESIGN.md), not
// a new surface: same sage ground, same ink type, no card chrome. `negative`
// is spent here deliberately — an actual failure, not "Sem lançamento"'s
// neutral `body` text.
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
      <TriangleAlert className="size-8 text-negative" aria-hidden />

      <div className="flex flex-col items-center gap-2">
        <p className="text-base text-ink">Algo deu errado.</p>
        <p className="text-sm text-body">Tente novamente.</p>
      </div>

      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-[24px] bg-primary px-6 text-[16px] font-semibold text-on-primary transition-colors hover:bg-primary-active focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <RotateCcw className="size-4" aria-hidden />
        Tentar novamente
      </button>
    </div>
  );
}
