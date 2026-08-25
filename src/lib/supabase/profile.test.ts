import { describe, expect, it, vi, beforeEach } from "vitest";

const fromMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => ({ from: fromMock }),
}));

import { getUserRole } from "./profile";

function maybeSingleBuilder(result: { data: unknown; error: unknown }) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
  };
  return builder;
}

describe("getUserRole", () => {
  beforeEach(() => fromMock.mockReset());

  it("returns the role from the matching profile row", async () => {
    fromMock.mockReturnValue(maybeSingleBuilder({ data: { role: "admin" }, error: null }));

    const role = await getUserRole("user-1");

    expect(fromMock).toHaveBeenCalledWith("profiles");
    expect(role).toBe("admin");
  });

  it("returns null when no profile row exists", async () => {
    fromMock.mockReturnValue(maybeSingleBuilder({ data: null, error: null }));

    const role = await getUserRole("user-1");

    expect(role).toBeNull();
  });

  it("throws when Supabase returns an error", async () => {
    fromMock.mockReturnValue(maybeSingleBuilder({ data: null, error: { message: "boom" } }));

    await expect(getUserRole("user-1")).rejects.toThrow("Falha ao buscar perfil do usuário");
  });
});
