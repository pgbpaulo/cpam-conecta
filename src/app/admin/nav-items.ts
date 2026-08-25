import type { UserRole } from "@/lib/supabase/profile";

// Nav items live as data, not markup, so a second and third route join this
// list without touching the header's structure — see DESIGN.md and the
// surface brief for src/app/admin/layout.tsx.
export const NAV_ITEMS = [
  { href: "/admin/lancar-preco", label: "Lançar Preço", adminOnly: false },
  { href: "/admin/insights", label: "Insights", adminOnly: true },
] as const;

export function getVisibleNavItems(role: UserRole | null) {
  return NAV_ITEMS.filter((item) => !item.adminOnly || role === "admin");
}
