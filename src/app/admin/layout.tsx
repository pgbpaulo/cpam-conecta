import type { Metadata } from "next";
import { LogOut } from "lucide-react";

import { logout } from "./actions";
import { NavLink } from "./nav-link";

export const metadata: Metadata = {
  title: "CPAM Conecta",
  description: "Painel interno do Ceasinha do Morango.",
};

// Nav items live as data, not markup, so a second and third route join this
// list without touching the header's structure — see DESIGN.md and the
// surface brief for src/app/admin/layout.tsx.
const NAV_ITEMS = [
  { href: "/admin/lancar-preco", label: "Lançar Preço" },
  { href: "/admin/insights", label: "Insights" },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-canvas-soft lg:flex-row">
      {/* Mobile/tablet: top header + horizontal tab strip. Untouched below lg.
          nav-bar (DESIGN.md) is a plain white bar — the canvas/canvas-soft
          contrast against the page below is the elevation cue, no border. */}
      <header className="bg-canvas lg:hidden">
        <div className="flex h-14 items-center justify-between gap-4 px-5">
          <span className="text-lg font-black tracking-[-0.02em] text-ink">
            CPAM Conecta
          </span>

          <form action={logout}>
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-1.5 text-sm text-body transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <LogOut className="size-4" aria-hidden />
              Sair
            </button>
          </form>
        </div>

        <nav aria-label="Navegação principal" className="overflow-x-auto px-5">
          <ul className="flex gap-6">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Desktop (lg+): persistent left rail, replacing the header entirely
          so width buys a real dashboard shell instead of a wider mobile page —
          see the desktop-layout finding in the 2026-08-23 critique. Built to
          grow past one route without restructuring (NAV_ITEMS stays the only
          thing a new route touches). White nav-bar surface, same borderless
          contrast cue as the mobile header. Pinned to the viewport
          (sticky + h-screen) rather than stretching to match `main`'s
          height — otherwise the rail grows with a tall page and the Sair
          button at its bottom scrolls out of view. */}
      <aside className="hidden shrink-0 flex-col bg-canvas lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60">
        <div className="flex h-16 items-center px-6">
          <span className="text-lg font-black tracking-[-0.02em] text-ink">
            CPAM Conecta
          </span>
        </div>

        <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href} variant="rail">
              {item.label}
            </NavLink>
          ))}
        </nav>

        <form action={logout} className="p-3">
          <button
            type="submit"
            className="inline-flex h-10 w-full items-center gap-1.5 rounded-[8px] px-3 text-sm text-body transition-colors hover:bg-canvas-soft hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <LogOut className="size-4" aria-hidden />
            Sair
          </button>
        </form>
      </aside>

      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
