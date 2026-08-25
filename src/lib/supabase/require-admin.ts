import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/supabase/profile";

const NOT_ADMIN_REDIRECT = "/admin/lancar-preco";

export async function requireAdmin(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user ? await getUserRole(user.id) : null;

  if (role !== "admin") {
    redirect(NOT_ADMIN_REDIRECT);
  }
}
