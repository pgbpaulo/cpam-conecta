---
target: "app-wide: /login, /admin/lancar-preco, /admin/insights"
total_score: 25
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 2
timestamp: 2026-08-24T18-56-08Z
slug: src-app-app-wide-login-lancar-preco-insights
---
Method: dual-agent (A: a09a263a83b4a1cf6 · B: a4b31d7923b66de13)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Save confirmation is excellent; day-switch and period-filter navigation give zero pending feedback |
| 2 | Match System / Real World | 3 | pt-BR throughout, but the native date input renders US MM/DD/YYYY |
| 3 | User Control and Freedom | 2 | No confirm/guard before discarding unsaved typed prices |
| 4 | Consistency and Standards | 3 | Card/button vocabulary very consistent; chart legend order breaks its own stated rule |
| 5 | Error Prevention | 2 | No warning before overwriting an already-"Lançado" day; free-text price inputs |
| 6 | Recognition Rather Than Recall | 4 | "Lançado"/"Sem lançamento" status always visible, text-labeled |
| 7 | Flexibility and Efficiency | 2 | Repetitive daily task, no "copy previous day" shortcut |
| 8 | Aesthetic and Minimalist Design | 3 | Clean card system; login is under-designed, chart ticks clutter at wide ranges |
| 9 | Error Recovery | 3 | Plain-language pt-BR errors; generic "tente novamente" doesn't distinguish offline vs. server error |
| 10 | Help and Documentation | n/a | 1-2 permanent internal users, no external audience to document for |
| **Total** | | **25/36** | **Acceptable (69%), bordering on Good** |

## Design Specificity Verdict

**LLM assessment:** The system executes DESIGN.md's component vocabulary competently (pill buttons, 24px no-border cards, disciplined lime-green-only-for-CTA accent) but little in the actual screens is authored *for a strawberry-pricing business specifically*. Swap the four category names for any SKU and "Lançar preço"/"Insights" could belong to any small inventory CRUD tool. The login screen is the clearest symptom — a near-empty white card adrift on a large sage field, with no wordmark treatment or brand moment, the opposite of the "calm, confident operations tool" DESIGN.md describes. The one real domain-specific idea — a fixed color per strawberry category — lives entirely on the Insights charts and never reaches the price-entry form those same categories are typed into daily. Net: a well-executed generic dashboard skinned in brand colors, not yet a tool that feels purpose-built for this business.

**Deterministic scan:** `detect.mjs` found 4 advisory findings, all in `price-trend-chart.tsx` (lines 43-47) — 4 chart-series colors outside DESIGN.md's documented palette. Reading the surrounding code, these are not drift: a 13-line comment documents that the colors come from a colorblind-validated data-viz palette, deliberately avoiding the brand's primary green. The detector correctly flagged them as *undocumented*, not as *wrong* — the fix is adding a data-viz palette section to DESIGN.md, not touching the code.

**Visual overlays:** No live browser-injection overlay was available in this session (no native browser tool exposed, and the Puppeteer-based URL scan mode requires `puppeteer`, which isn't installed in this project). Evidence instead comes from 6 real screenshots (login/lancar-preco/insights × mobile/desktop) captured against the live dev server with a real authenticated session via a hand-rolled Playwright script — the sanctioned fallback per protocol. No user-visible in-browser overlay exists to point you to; all findings below are grounded directly in those screenshots and the source.

## Overall Impression

The design system itself (DESIGN.md's lime-green/sage/near-black world) is applied with real discipline — cards, buttons, badges, and the green-only-for-primary-actions rule are consistent across all three screens, and the core save-confirmation moment is genuinely well built. What's missing for a "more professional" impression isn't the design system, it's finishing craft: an under-designed login screen (the very first thing anyone sees), a chart legend that visibly contradicts its own ordering logic, silence during navigation on an app built explicitly for bad connections, and zero visual thread connecting the category color-coding on Insights to the price-entry form people use every day. These are all fixable without touching the visual language you already committed to.

## What's Working

1. **Non-silent save confirmation** (`strawberry-price-form.tsx`) — explicit timestamp plus per-category "Novo/Atualizado" tags gives real certainty under bad connectivity, directly answering the product brief's core requirement.
2. **Status never rides color alone** — every "Lançado" badge pairs an icon with the word itself; unlaunched states say "Sem lançamento" in text. A real accessibility-by-default choice that also helps first-time users.
3. **Connectivity-aware primitives** — native date input instead of a heavy picker, comma-decimal price parsing tuned to pt-BR phone keyboards. Low-JS choices that match the stated "weak signal, one hand" constraint.

## Priority Issues

**[P1] Silent data loss on day-switch without saving**
- **Why it matters:** Typing prices then tapping a different day (or losing connection mid-entry) discards everything with no warning — directly contradicts the product's "trustworthy over flashy" principle, and this app is explicitly used on unreliable connections.
- **Fix:** Add an unsaved-changes guard before navigating away, or a lightweight local draft-autosave.
- **Suggested command:** `/impeccable harden`

**[P1] No loading feedback on day-select / period-filter navigation**
- **Why it matters:** The app's one real anxiety point ("did this actually work?") is solved beautifully for saving but reappears everywhere else — day-list rows and period-filter chips are plain links with zero pending state, on an app whose whole premise is bad connectivity.
- **Fix:** Add a pending indicator matching the visual language already used for "Salvando…".
- **Suggested command:** `/impeccable polish`

**[P2] Desktop login reads as an unfinished placeholder**
- **Why it matters:** A 352px white card floating in ~900px of empty sage canvas, no wordmark or brand moment — the opposite of the "more professional" look being asked for, on the very first screen anyone sees.
- **Fix:** Use DESIGN.md's own richer vocabulary here (e.g. a dark feature-card side panel or a composed two-column layout) so the card isn't adrift at wide viewports.
- **Suggested command:** `/impeccable polish`

**[P2] Chart legend order contradicts its own accessibility rationale**
- **Why it matters:** `price-trend-chart.tsx`'s own code comments state the legend is "ordered to match the in-chart bar order" as a colorblind-accessibility measure, but the rendered legend is alphabetical while the chart is category-order — visible directly in the Insights screenshots. Reads as sloppy rather than polished, and quietly breaks the accessibility claim it makes about itself.
- **Fix:** Pass an explicit ordered payload into the chart legend in both chart components.
- **Suggested command:** `/impeccable polish`

**[P2] No shared category color identity between price entry and charts**
- **Why it matters:** Insights color-codes every strawberry category everywhere (chart, tooltip, extremes list) but the price-entry form — the screen used daily — shows the same categories in plain black text. The one piece of real domain-specific visual thinking never reaches the app's core task.
- **Fix:** Reuse the same small color swatch next to each category heading in `strawberry-price-form.tsx`.
- **Suggested command:** `/impeccable colorize`

**[P3] Native date field renders US format inside a pt-BR app**
- **Why it matters:** The date input shows `08/24/2026` (MM/DD/YYYY) while every other date on the same screen uses pt-BR DD/MM formatting — a visible, jarring inconsistency for a Brazilian user, confirmed in both mobile and desktop screenshots.
- **Fix:** Confirm `<html lang="pt-BR">` is set app-wide, or pair the native input with a formatted pt-BR read-out next to it.
- **Suggested command:** `/impeccable polish`

**[P3] Data-viz palette isn't documented in DESIGN.md**
- **Why it matters:** The 4 chart colors are a deliberate, colorblind-validated choice (per code comments) but live outside the design system doc — the mechanical detector correctly flags them as undocumented, and future contributors have no source of truth for "these are the sanctioned category colors."
- **Fix:** Add a small data-viz/categorical-palette section to DESIGN.md capturing the 4 hexes and the dash/shape secondary-encoding rule.
- **Suggested command:** `/impeccable document`

**[P3] Chart x-axis ticks clutter at wider date ranges**
- **Why it matters:** At the 90-day/"Tudo" range, `price-trend-chart.tsx` renders a tick per data point, producing a cramped date row on desktop that undercuts the otherwise calm chart styling.
- **Fix:** Cap the XAxis to ~6-8 evenly spaced ticks regardless of range.
- **Suggested command:** `/impeccable polish`

## Persona Red Flags

**Jordan (First-Timer):** Lands on mobile `/admin/lancar-preco` and sees 11+ rows of a green "Lançado" history list before the actual data-entry form appears — no cue to scroll past it. Also finds two apparently-redundant ways to pick a day (tap a list row, or use the date input + separate "Ver" button) with no explanation of when to use which.

**Casey (Distracted Mobile User):** Types several prices, gets interrupted, and if the connection drops or they tap a different day, everything is silently lost (P1 above). On a slow connection, tapping a day row or a period-filter chip gives no visible response for several seconds — real risk of a confused double-tap.

**Sam (Accessibility-Dependent):** The `mute` text color (`#868685` on white, ~3.9:1 contrast) used for "Sem lançamento," "Sem dados," and chart axis labels sits below WCAG AA for normal text — this was already a known, deferred issue from the `lancar-preco` build and this audit confirms it now recurs on `/admin/insights` too. The chart legend/bar order mismatch (P2 above) also directly weakens the colorblind-accessibility argument the code itself claims to make.

## Minor Observations

- "Safra Nova Diferenciado" wraps to two lines in the mobile category price list, breaking baseline alignment against the other single-line rows.
- On the Insights desktop stat row, "Safra Nova Top" wraps across three lines while "Velho" and "Bom" fit on one line in sibling cells — visibly cramped compared to the row's other cards.
- The "Preço médio do período" card is the only Insights stat visually emphasized (pale-green tint); the reason it alone stands out isn't obvious to a non-technical reader.
- Two parallel ways to change the selected day (list row vs. date input + "Ver") with no visual cue for why both exist.
- A small dark circular badge appears bottom-left in 3 of the 6 screenshots, overlapping "Sair" on desktop and list content on mobile — almost certainly the Next.js dev-mode indicator rather than app code; worth a quick confirmation it's absent from a production build, not a real defect to fix.

## Questions to Consider

- What would it look like if the four category names carried their color identity everywhere, including the form people fill in every day, not just the analytics screen?
- Is the login screen's current restraint deliberate, or does the tool's first impression need to match the ambition of the rest of the system now that it represents a real business?
- Given both users work over unreliable connections, is silently losing an unsaved entry an acceptable risk, or does "trustworthy over flashy" require a safety net?
