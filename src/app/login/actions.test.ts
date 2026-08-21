import { describe, expect, it, vi, beforeEach } from "vitest";

const signInWithPassword = vi.fn();
const redirectMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => ({ auth: { signInWithPassword } }),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    redirectMock(path);
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
}));

import { login } from "./actions";

function formDataWith(email: string, password: string) {
  const formData = new FormData();
  formData.set("email", email);
  formData.set("password", password);
  return formData;
}

describe("login", () => {
  beforeEach(() => {
    signInWithPassword.mockReset();
    redirectMock.mockReset();
  });

  it("returns an error state when credentials are invalid", async () => {
    signInWithPassword.mockResolvedValue({ error: { message: "Invalid login credentials" } });

    const result = await login(
      { status: "idle" },
      formDataWith("funcionaria@example.com", "wrong")
    );

    expect(result).toEqual({ status: "error", message: "E-mail ou senha incorretos." });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects to /admin when credentials are valid", async () => {
    signInWithPassword.mockResolvedValue({ error: null });

    await expect(
      login({ status: "idle" }, formDataWith("funcionaria@example.com", "correct"))
    ).rejects.toThrow("NEXT_REDIRECT:/admin");

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "funcionaria@example.com",
      password: "correct",
    });
    expect(redirectMock).toHaveBeenCalledWith("/admin");
  });
});
