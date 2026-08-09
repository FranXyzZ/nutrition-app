import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/app/onboarding/profile-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-10">
        <p className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
          Configuración inicial
        </p>
        <h1 className="text-2xl font-semibold">Contanos sobre vos</h1>
        <p className="mt-2 text-sm text-muted">
          Con estos datos calculamos tus calorías y macros diarios. Vas a poder ajustarlos en
          cualquier momento.
        </p>
      </div>

      <ProfileForm />
    </main>
  );
}
