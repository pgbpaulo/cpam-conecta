import type { Metadata } from "next";
import { LogOut } from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/supabase/profile";

import { logout } from "./actions";
import { NavLink } from "./nav-link";
import { getVisibleNavItems } from "./nav-items";

export const metadata: Metadata = {
  title: "CPAM Conecta",
  description: "Painel interno do Ceasinha do Morango.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user ? await getUserRole(user.id) : null;
  const navItems = getVisibleNavItems(role);

  return (
    <div className="flex min-h-full flex-col bg-canvas-soft lg:flex-row">
      {/* Mobile/tablet: top header + horizontal tab strip. Untouched below lg.
          nav-bar (DESIGN.md) is a plain white bar — the canvas/canvas-soft
          contrast against the page below is the elevation cue, no border. */}
      <header className="bg-canvas lg:hidden">
        <div className="flex h-14 items-center justify-between gap-3 px-5">
          <span className="shrink-0 text-lg font-black tracking-[-0.02em] text-ink">
            CPAM Conecta
          </span>

          <div className="flex min-w-0 items-center gap-3">
            {user?.email ? (
              <span
                className="truncate text-xs text-mute"
                title={user.email}
              >
                {user.email}
              </span>
            ) : null}

            <form action={logout} className="shrink-0">
              <button
                type="submit"
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 text-sm text-body transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <LogOut className="size-4" aria-hidden />
                Sair
              </button>
            </form>
          </div>
        </div>

        <nav aria-label="Navegação principal" className="overflow-x-auto px-5">
          <ul className="flex gap-6">
            {navItems.map((item) => (
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
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} variant="rail">
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-canvas-soft p-3">
          {user?.email ? (
            <p
              className="truncate px-3 pb-2 text-xs text-mute"
              title={user.email}
            >
              {user.email}
            </p>
          ) : null}

          <form action={logout}>
            <button
              type="submit"
              className="inline-flex h-10 w-full cursor-pointer items-center gap-1.5 rounded-[8px] px-3 text-sm text-body transition-colors hover:bg-canvas-soft hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <LogOut className="size-4" aria-hidden />
              Sair
            </button>
          </form>
        </div>
      </aside>

      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
