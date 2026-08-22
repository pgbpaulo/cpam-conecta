import { describe, expect, it, vi, beforeEach } from "vitest";

const signOut = vi.fn();
const redirectMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => ({ auth: { signOut } }),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    redirectMock(path);
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
}));

import { logout } from "./actions";

describe("logout", () => {
  beforeEach(() => {
    signOut.mockReset();
    redirectMock.mockReset();
    signOut.mockResolvedValue({ error: null });
  });

  it("signs the user out and redirects to /login", async () => {
    await expect(logout()).rejects.toThrow("NEXT_REDIRECT:/login");

    expect(signOut).toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
