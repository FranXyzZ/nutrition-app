import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/app/onboarding/profile-form";
import { SignOutButton } from "@/app/settings/sign-out-button";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { count: checkinsCount }] = await Promise.all([
    supabase
      .from("profiles")
      .select("age, sex, weight_kg, height_cm, activity_level, goal")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("day_checkins")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  return (
    <main className="pb-nav mx-auto max-w-lg px-4 py-8 sm:max-w-2xl sm:px-6 sm:py-12">
      <p className="mb-8 text-sm text-muted">
        Recalculá tus calorías y macros diarios si cambió tu peso, actividad u objetivo.
      </p>

      <div className="mb-8 rounded-2xl border border-border bg-surface p-5">
        <p className="mb-1 truncate text-sm font-medium">{user.email}</p>
        <p className="mb-4 text-xs text-muted">Sesión iniciada</p>
        <SignOutButton />
      </div>

      <nav className="mb-8 overflow-hidden rounded-2xl border border-border bg-surface">
        <Link
          href="/calendar"
          className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-surface-elevated"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-calories">
              <CalendarIcon />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">Check-ins</span>
              <span className="block text-xs text-muted">Días que marcaste que comiste bien</span>
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="tabular-data text-sm font-semibold text-calories">
              {checkinsCount ?? 0}
            </span>
            <ChevronRightIcon />
          </div>
        </Link>
      </nav>

      <ProfileForm
        initialProfile={
          profile
            ? {
                age: profile.age,
                sex: profile.sex,
                weightKg: profile.weight_kg,
                heightCm: profile.height_cm,
                activityLevel: profile.activity_level,
                goal: profile.goal,
              }
            : undefined
        }
      />
    </main>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4.5 w-4.5"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <path d="m8.5 15 2 2 4-4" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-muted"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
