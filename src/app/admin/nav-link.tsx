"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type NavLinkProps = ComponentProps<typeof Link> & {
  // "tab": the mobile/tablet header's horizontal tab strip (underlined).
  // "rail": the desktop sidebar's vertical item — follows DESIGN.md's
  // ex-app-shell-row example literally: a primary-green active indicator,
  // rounded.sm (8px). The one place this admin shell uses the accent outside
  // a primary CTA — DESIGN.md itself carves out the nav indicator as this
  // token's other sanctioned use.
  variant?: "tab" | "rail";
};

export function NavLink({ href, className, children, variant = "tab", ...props }: NavLinkProps) {
  const pathname = usePathname();
  const isActive =
    typeof href === "string" &&
    (pathname === href || pathname?.startsWith(`${href}/`));

  if (variant === "rail") {
    return (
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex h-10 items-center rounded-r-[8px] border-l-[3px] pr-3 pl-3.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink",
          isActive
            ? "border-primary bg-primary-pale font-semibold text-ink"
            : "border-transparent text-body hover:bg-canvas-soft hover:text-ink",
          className
        )}
        {...props}
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "inline-flex h-12 items-center border-b-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        isActive
          ? "border-primary font-semibold text-ink"
          : "border-transparent text-body hover:text-ink",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
