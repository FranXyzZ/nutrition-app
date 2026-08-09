import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Todavía no hay landing/marketing page (eso es Fase 5). Mientras
// tanto, "/" no debe mostrar nada propio — solo manda a cada usuario
// a donde le corresponde: al dashboard si ya tiene sesión, al login
// si no. Antes esta ruta mostraba el boilerplate de create-next-app
// (logo de Next.js, "Deploy Now", etc.) porque nunca se reemplazó.
export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/dashboard" : "/login");
}
