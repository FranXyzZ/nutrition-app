import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sumTotals, todayDateString } from "@/lib/nutrition/meal-types";
import { buildDailyTimeline } from "@/lib/nutrition/timeline";
import { DaySummary } from "@/app/dashboard/day-summary";
import { MacroTrendChart } from "@/app/dashboard/macro-trend-chart";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const today = todayDateString();

  const [{ data: goals }, { data: meals }] = await Promise.all([
    supabase.from("macro_goals").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("meals")
      .select("id, meal_type")
      .eq("user_id", user.id)
      .eq("logged_date", today),
  ]);

  const mealIds = (meals ?? []).map((m) => m.id);

  const { data: entries } =
    mealIds.length > 0
      ? await supabase
          .from("food_entries")
          .select("*")
          .in("meal_id", mealIds)
          .order("logged_at", { ascending: true })
      : { data: [] };

  const allEntries = entries ?? [];
  const dailyTotals = sumTotals(allEntries);

  if (!goals) {
    return (
      <main className="pb-nav mx-auto max-w-lg px-4 py-8 sm:px-6 sm:py-12">
        <h2 className="mb-4 text-lg font-semibold">Todavía no configuraste tus objetivos</h2>
        <p className="mb-6 text-sm text-muted">
          Completá tu perfil para ver tu progreso diario y la evolución de tus macros.
        </p>
        <a
          href="/onboarding"
          className="inline-block rounded-xl bg-calories px-5 py-2.5 text-sm font-medium text-black"
        >
          Completar perfil
        </a>
      </main>
    );
  }

  const timeline = buildDailyTimeline(allEntries, goals);

  return (
    <main className="pb-nav mx-auto max-w-lg space-y-5 px-4 py-8 sm:max-w-2xl">
      <Link
        href="/food"
        className="block rounded-2xl transition-opacity active:opacity-80"
        aria-label="Ver y agregar comidas"
      >
        <DaySummary
          carbsConsumed={dailyTotals.carbsG}
          carbsGoal={goals.carbs_g}
          proteinConsumed={dailyTotals.proteinG}
          proteinGoal={goals.protein_g}
          fatConsumed={dailyTotals.fatG}
          fatGoal={goals.fat_g}
          caloriesConsumed={dailyTotals.calories}
          caloriesGoal={goals.calories}
        />
      </Link>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="text-sm font-medium">Evolución del día</h2>
          <span className="tabular-data text-xs text-muted">% del objetivo</span>
        </div>
        {allEntries.length === 0 && (
          <p className="mb-2 text-xs text-muted">
            Todavía no registraste alimentos hoy — la línea arranca en 0% y se va a ir moviendo a
            medida que agregues comidas.
          </p>
        )}
        <MacroTrendChart data={timeline} />
      </div>

      <Link
        href="/food"
        className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-calories py-3.5 text-sm font-semibold text-black transition-opacity active:opacity-80"
      >
        <span className="text-base leading-none">+</span> Agregar comidas
      </Link>
    </main>
  );
}
