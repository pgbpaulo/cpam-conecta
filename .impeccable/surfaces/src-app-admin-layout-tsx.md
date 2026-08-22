---
version: 1
slug: "src-app-admin-layout-tsx"
primary_target: "src/app/admin/layout.tsx"
related_targets: ["src/app/admin/nav-link.tsx"]
---

**Scope & mode:** `src/app/admin/layout.tsx` — the shell wrapping every `/admin/**` route. Operate mode: the visitor completes a task (log in, log a price, sign out); chrome must never outrank the task.

**Audience, job, action, constraints:** 1-2 internal users (funcionária/dono of Ceasinha do Morango), primarily on a phone, often on weak connectivity. Job: reach a task page, know which page they're on, sign out when done. Constraint: server component, `{ children: React.ReactNode }`; nav must be structured to grow past its current one item; logout submits the `logout` Server Action from `./actions` via `<form action={logout}>`.

**Chosen direction:** inherit "The Entreposto Board" established on `/login` rather than open a second world for the same tiny internal tool. A sticky header on the board ground (`bg-board-ground`, `border-board-rule` divider) holds the wordmark and a text-style logout control (`Sair`, chalk-label → chalk-white on hover, never boxed), with a second row underneath as a ruled tab strip (`NavLink`, `src/app/admin/nav-link.tsx`) driven off a `NAV_ITEMS` data array so a second and third route join without restructuring the header. The One Accent Rule (DESIGN.md) is honored: strawberry stays reserved for a page's own primary action and field focus, so the active tab and the logout control are carried by weight/color (chalk-white vs. chalk-label) and a chalk-white rule, never by the accent.

**Memorable moment:** none sought here by design — an Operate shell earns its keep by staying out of the way; the memorable moment belongs to the task pages it wraps (e.g. `lancar-preco`'s save confirmation).

**Unresolved / left for later surfaces:**
- Nav item count is untested past one; when it grows past what fits one row on a narrow phone, revisit whether the tab strip should scroll horizontally (current CSS: `overflow-x-auto`) or collapse into a menu.
- No visual regression/screenshot verification was possible in this build session: no live Supabase credentials and no browser/screenshot tool were available, so the shell was verified by code review against DESIGN.md and craft-floor.md, the mechanical detector (`detect.mjs`, clean), `tsc --noEmit`, and `next build` — not by a rendered capture. Worth a real screenshot pass once `/admin/lancar-preco` exists and a seeded test user is available.
