import type { StrawberryCategory } from "@/lib/validation/strawberry-price";

// The single source of truth for "which color is this strawberry category"
// across the app — the insights charts (price-trend-chart.tsx,
// annual-averages-chart.tsx) and the price-entry form both key off this so
// a category reads as the same color everywhere, not just inside Insights.
// Values: slots 1-4 of the `dataviz` skill's documented default palette, in
// STRAWBERRY_CATEGORIES order — validated colorblind-safe with
// `validate_palette.js` (worst adjacent CVD ΔE 9.1, normal-vision floor
// 22.9). Never {colors.primary} (#9fe870), which DESIGN.md reserves
// exclusively for CTAs.
export const STRAWBERRY_CATEGORY_COLOR: Record<StrawberryCategory, string> = {
  Velho: "#2a78d6",
  Bom: "#eb6834",
  "Safra Nova Top": "#1baf7a",
  "Safra Nova Diferenciado": "#eda100",
};
