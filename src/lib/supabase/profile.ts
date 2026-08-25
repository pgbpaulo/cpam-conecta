import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "operador";

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao buscar perfil do usuário: ${error.message}`);
  }

  return data?.role ?? null;
}
