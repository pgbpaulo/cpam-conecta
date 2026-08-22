"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type NavLinkProps = ComponentProps<typeof Link>;

// A tab-style nav row, ruled underneath like every other field on the board
// rather than boxed — see DESIGN.md "Shapes". The active state is carried by
// weight/color and a chalk-white rule, not by the strawberry accent: The One
// Accent Rule reserves strawberry for the primary action and field focus
// only, and a nav link is neither.
export function NavLink({ href, className, children, ...props }: NavLinkProps) {
  const pathname = usePathname();
  const isActive =
    typeof href === "string" &&
    (pathname === href || pathname?.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "inline-flex h-12 items-center border-b-2 text-xs font-bold tracking-[0.14em] uppercase transition-colors",
        isActive
          ? "border-chalk-white text-chalk-white"
          : "border-transparent text-chalk-label hover:text-chalk-white",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
