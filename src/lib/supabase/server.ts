import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Cliente de Supabase para Server Components, Server Actions
 * y Route Handlers. Usa la anon key + la sesión del usuario
 * (vía cookies), así que sigue respetando RLS.
 *
 * Este es el que usás para leer/escribir datos "normales"
 * del usuario logueado (perfil, comidas, macros, chats).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Se puede ignorar si esto se llama desde un
            // Server Component: el middleware ya refresca
            // la sesión en ese caso.
          }
        },
      },
    }
  );
}
