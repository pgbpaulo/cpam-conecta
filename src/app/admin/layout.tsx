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
    <div className="flex min-h-full flex-col bg-board-ground">
      <header className="border-b border-board-rule">
        <div className="flex h-14 items-center justify-between gap-4 px-5">
          <span className="text-sm font-bold tracking-[0.14em] text-chalk-white uppercase">
            CPAM Conecta
          </span>

          <form action={logout}>
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-1.5 text-xs font-bold tracking-[0.14em] text-chalk-label uppercase transition-colors hover:text-chalk-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-strawberry-focus"
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

      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
