import type { MealType } from "@/lib/supabase/database.types";

export const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "Desayuno" },
  { value: "lunch", label: "Almuerzo" },
  { value: "dinner", label: "Cena" },
  { value: "snack", label: "Snacks" },
];

export interface FoodTotals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export function emptyTotals(): FoodTotals {
  return { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
}

export function sumTotals(
  entries: { calories: number; protein_g: number; carbs_g: number; fat_g: number }[]
): FoodTotals {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + Number(e.calories),
      proteinG: acc.proteinG + Number(e.protein_g),
      carbsG: acc.carbsG + Number(e.carbs_g),
      fatG: acc.fatG + Number(e.fat_g),
    }),
    emptyTotals()
  );
}

/** Devuelve la fecha de hoy en formato YYYY-MM-DD (zona local del server). */
export function todayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
