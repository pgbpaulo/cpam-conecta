---
version: 1
slug: "src-app-admin-layout-tsx"
primary_target: "src/app/admin/layout.tsx"
related_targets: ["src/app/admin/nav-link.tsx"]
---

**Scope & mode:** `src/app/admin/layout.tsx` — the shell wrapping every `/admin/**` route. Operate mode: the visitor completes a task (log in, log a price, sign out); chrome must never outrank the task.

**Audience, job, action, constraints:** 1-2 internal users (funcionária/dono of Ceasinha do Morango), primarily on a phone, often on weak connectivity. Job: reach a task page, know which page they're on, sign out when done. Constraint: server component, `{ children: React.ReactNode }`; nav must stay structured to grow past its current one item; logout submits the `logout` Server Action from `./actions` via `<form action={logout}>`.

**Chosen direction:** second retheme in one day, onto a new "CPAM Conecta" world (2026-08-23, second revision) adapted from a Wise-inspired reference the user supplied at `wise/DESIGN.md` and asked to apply app-wide ("faça um rebrand de todo o site com esse design"). Replaces the cream/charcoal world from earlier the same day. New system: sage `canvas-soft` page ground, white `canvas` cards at `rounded-[24px]` with no border (surface contrast alone carries elevation — DESIGN.md's Elevation table explicitly bans borders on cards), a lime-green `primary` (`#9fe870`) reserved for every primary-action button plus the nav active-indicator (the one other sanctioned use, per DESIGN.md's own `ex-app-shell-row` example), black-bordered (`border-ink`) form inputs, and Inter at weight 900 for the one per-page heading (login title, `lancar-preco`'s h1), 600 for nav/labels/buttons, 400 for body. Status is carried by pill badges (`badge-positive`-style: `bg-primary-neutral`/`bg-primary-pale` + `text-positive-deep`) rather than plain colored text. `wise/DESIGN.md` was renamed from "Wise" to "CPAM Conecta" throughout (same correction pattern as the prior Intercom-sourced revision) before being adapted into the root `DESIGN.md`.

**Memorable moment:** unchanged — none sought here by design; the Operate shell stays out of the way, task pages carry the moment (e.g. `lancar-preco`'s save confirmation, now a lime-green pill button + badge-positive tags).

**Unresolved / left for later surfaces:**
- Nav item count is untested past one — unchanged from before this pass.
- No live-render or screenshot verification was possible this session (same gap as the prior revision): no browser/screenshot tool is available in this environment and the authenticated `/admin` routes need real Supabase credentials to reach past `/login`. Verified instead by `tsc --noEmit`, `next build`, the mechanical detector (`detect.mjs` — caught and fixed two off-ramp font sizes before going clean), and an unauthenticated curl of `/login`'s rendered HTML confirming the new token classes (`bg-canvas-soft`, `bg-primary`, `border-ink`, `rounded-[24px]`) are present. A real screenshot pass across `/login` and both `/admin/lancar-preco` breakpoints is still owed once a browser tool or seeded test session is available.
