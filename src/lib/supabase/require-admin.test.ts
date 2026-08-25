import { describe, expect, it, vi, beforeEach } from "vitest";

const getUser = vi.fn();
const getUserRoleMock = vi.fn();
const redirectMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => ({ auth: { getUser } }),
}));

vi.mock("@/lib/supabase/profile", () => ({
  getUserRole: (userId: string) => getUserRoleMock(userId),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    redirectMock(path);
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
}));

import { requireAdmin } from "./require-admin";

describe("requireAdmin", () => {
  beforeEach(() => {
    getUser.mockReset();
    getUserRoleMock.mockReset();
    redirectMock.mockReset();
  });

  it("does nothing when the current user is an admin", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    getUserRoleMock.mockResolvedValue("admin");

    await requireAdmin();

    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects to /admin/lancar-preco when the user is not an admin", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    getUserRoleMock.mockResolvedValue("operador");

    await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT:/admin/lancar-preco");

    expect(redirectMock).toHaveBeenCalledWith("/admin/lancar-preco");
  });

  it("redirects when there is no signed-in user", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT:/admin/lancar-preco");

    expect(getUserRoleMock).not.toHaveBeenCalled();
  });
});
