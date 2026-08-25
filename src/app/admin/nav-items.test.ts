import { describe, expect, it } from "vitest";

import { getVisibleNavItems } from "./nav-items";

describe("getVisibleNavItems", () => {
  it("excludes admin-only items when the user has no role", () => {
    const hrefs = getVisibleNavItems(null).map((item) => item.href);

    expect(hrefs).toContain("/admin/lancar-preco");
    expect(hrefs).not.toContain("/admin/insights");
  });

  it("excludes admin-only items for an operador", () => {
    const hrefs = getVisibleNavItems("operador").map((item) => item.href);

    expect(hrefs).not.toContain("/admin/insights");
  });

  it("includes admin-only items for an admin", () => {
    const hrefs = getVisibleNavItems("admin").map((item) => item.href);

    expect(hrefs).toContain("/admin/insights");
  });
});
