import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Cliente de Supabase con la service_role key.
 * BYPASSEA RLS POR COMPLETO.
 *
 * Reglas de uso:
 * 1. El import "server-only" de arriba hace que el build
 *    falle si este archivo termina importado desde código
 *    de cliente (browser).
 * 2. Usar SOLO para operaciones muy puntuales del backend,
 *    como insertar los mensajes 'assistant' de la IA.
 * 3. ANTES de cualquier insert/update acá, validar a mano
 *    que el recurso (ej: chat_id) le pertenece al usuario
 *    autenticado (auth.uid() sacado del JWT de la sesión,
 *    nunca de un valor mandado por el cliente).
 * 4. Nunca exponer este cliente ni la service_role key en
 *    ninguna respuesta, log, o variable NEXT_PUBLIC_*.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
