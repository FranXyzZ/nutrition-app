import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MEAL_TYPES, sumTotals, todayDateString } from "@/lib/nutrition/meal-types";
import { MealSection } from "@/app/food/meal-section";
import { DaySummary } from "@/app/dashboard/day-summary";
import type { MealType } from "@/lib/supabase/database.types";

export default async function FoodPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const today = todayDateString();

  const [{ data: meals }, { data: goals }] = await Promise.all([
    supabase
      .from("meals")
      .select("id, meal_type")
      .eq("user_id", user.id)
      .eq("logged_date", today),
    supabase.from("macro_goals").select("*").eq("user_id", user.id).maybeSingle(),
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

  // Agrupar entries por tipo de comida, cubriendo los 4 tipos
  // aunque todavía no exista el registro de "meal" para ese día.
  const entriesByType: Record<MealType, typeof entries> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };

  for (const meal of meals ?? []) {
    const mealEntries = (entries ?? []).filter((e) => e.meal_id === meal.id);
    entriesByType[meal.meal_type] = mealEntries;
  }

  const allEntries = entries ?? [];
  const dailyTotals = sumTotals(allEntries);

  return (
    <main className="pb-nav mx-auto max-w-lg space-y-6 px-4 py-8 sm:max-w-2xl sm:px-6 sm:py-12">
      {goals ? (
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
      ) : (
        <p className="rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-muted">
          Todavía no configuraste tus objetivos.{" "}
          <a href="/onboarding" className="underline underline-offset-4">
            Completá tu perfil
          </a>{" "}
          para ver tu progreso acá.
        </p>
      )}

      <div className="space-y-4">
        {MEAL_TYPES.map(({ value, label }) => (
          <MealSection
            key={value}
            mealType={value}
            label={label}
            entries={entriesByType[value] ?? []}
          />
        ))}
      </div>
    </main>
  );
}
