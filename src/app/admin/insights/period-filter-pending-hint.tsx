"use client";

import { Loader2 } from "lucide-react";
import { useLinkStatus } from "next/link";

import { cn } from "@/lib/utils";

// Must be a descendant *component* of the <Link>, not an inline expression
// in the parent's render — useLinkStatus reads context Link provides to its
// subtree. Always rendered at a fixed size so toggling it never shifts the
// filter chip's width (Next's own useLinkStatus guidance).
export function PeriodFilterPendingHint() {
  const { pending } = useLinkStatus();
  return (
    <Loader2
      aria-hidden
      className={cn(
        "size-3.5 shrink-0 animate-spin transition-opacity",
        pending ? "opacity-100" : "opacity-0"
      )}
    />
  );
}
