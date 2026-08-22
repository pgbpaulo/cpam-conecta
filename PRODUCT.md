# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users: a funcionária (employee) and o dono (owner) of "Ceasinha do Morango", a
small strawberry market/vendor business in Bom Repouso, Minas Gerais, Brazil. Exactly 1-2
people use the system. They access it on a mobile phone, often with poor/unreliable
internet connectivity. No public sign-up — the two accounts are created manually by the
owner via the Supabase Auth dashboard.

## Product Purpose

CPAM Conecta is an internal operations dashboard for Ceasinha do Morango. Its first
capability: structured daily logging of the reference price (min/max) for boxes of
strawberries, per quality category (Velho, Bom, Safra Nova Top, Safra Nova
Diferenciado), replacing the current practice of writing this as free-text messages in
WhatsApp. Success means the owner/employee can reliably log and review the last ~15 days
of pricing quickly on a phone, even under poor connectivity, with an explicit
(non-silent) confirmation that data was saved.

## Positioning

[ASSUMPTION — inferred, not confirmed: this is an internal, single-tenant tool built for
one specific family business, not a market product; there is no external positioning
claim or competitor to differentiate from. Its distinguishing mechanism is simply
replacing unstructured WhatsApp text with a structured, historized price record.]

## Operating Context

- Used in the field/market context by people running a small produce business;
  connectivity is frequently poor (the approved design spec explicitly calls out
  "conexão possivelmente ruim").
- Primary device: mobile phone (spec: "num celular").
- Core workflow (later stages): log in → land on `/admin` (redirects to
  `/admin/lancar-preco`) → view the last 15 days (Mon–Sat) with
  lançado/sem-lançamento status → select a day → fill in up to 4 category price ranges →
  save → see an explicit confirmation, staying on the page (no silent redirect).
- Auth: Supabase Auth, email + password, no public registration; two roles (`admin`,
  `operador`) exist in the data model but currently grant identical permissions.

## Capabilities and Constraints

- Confirmed stack (already in the repo, not a decision for this task): Next.js App
  Router (v16), React 19, TypeScript, Tailwind CSS v4, shadcn/ui (style "base-nova",
  base color neutral; only `Button` installed so far), Supabase (`@supabase/ssr`,
  `@supabase/supabase-js`) for auth and Postgres.
- Constraint: mobile-first, must perform acceptably on poor/slow connections — favor
  Server Components/Server Actions over heavy client-side JS (already the architecture
  decision in the approved design spec).
- Constraint: UI text must be Portuguese (pt-BR); code identifiers (file/variable/
  function names) are English (en-US). Exception: the DB schema (`precos_morango`,
  `categoria`, `preco_min`, `preco_max`, and the 4 `categoria` values) is pt-BR by
  design.
- Constraint: `/login` is a pre-authentication screen — no sidebar/nav chrome; that
  chrome only exists inside `/admin` after login.
- Explicitly undecided / out of scope for the current stage: role-based permission
  differentiation between `admin` and `operador` (infrastructure exists, not yet
  enforced); production deployment (work stays local via `npm run dev` for now).

## Brand Commitments

- Product name: "CPAM Conecta" (given by the user, not invented).
  [ASSUMPTION: no confirmed meaning for the "CPAM" initialism, no logo, and no
  color/typography identity has been confirmed — none of that is invented here.]
- The business itself is named "Ceasinha do Morango", located in Bom Repouso/MG.

## Evidence on Hand

None. No existing screenshots, logos, testimonials, or brand assets are in the repo. The
only visual artifact present is the unmodified `create-next-app` boilerplate homepage
(`src/app/page.tsx`) and the default shadcn/ui "base-nova" design tokens in
`globals.css` — treated as scaffold, not as an intentional visual identity to preserve.

## Product Principles

1. Trustworthy over flashy: this is a record-of-truth for pricing decisions; correctness
   and explicit confirmation of saves matter more than visual flourish.
2. Built for one hand, one bar of signal: every interaction must work well on a mobile
   phone under weak connectivity.
3. Small, closed user base: no onboarding funnel, no public marketing surface — every
   screen is Operate-mode, task-focused.
4. Portuguese for people, English for code: never mix the two across that boundary.

## Accessibility & Inclusion

No product-specific accessibility requirement has been confirmed; standard web
accessibility practices apply by default.
