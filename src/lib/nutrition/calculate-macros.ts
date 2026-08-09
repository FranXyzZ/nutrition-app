import type { ActivityLevel, Goal, Sex } from "@/lib/supabase/database.types";

export interface MacroCalculationInput {
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  goal: Goal;
}

export interface MacroCalculationResult {
  bmr: number;
  tdee: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// Ajuste calórico según objetivo: déficit para perder grasa,
// superávit moderado para ganar masa, sin cambios para mantener.
const CALORIE_ADJUSTMENT: Record<Goal, number> = {
  lose_fat: -0.2,
  maintain: 0,
  gain_muscle: 0.15,
};

// Gramos de proteína por kg de peso corporal. Priorizamos
// preservar/construir músculo por encima del % calórico fijo.
const PROTEIN_G_PER_KG: Record<Goal, number> = {
  lose_fat: 2.2,
  maintain: 2.0,
  gain_muscle: 2.0,
};

// % de las calorías totales que vienen de grasa.
const FAT_PERCENTAGE: Record<Goal, number> = {
  lose_fat: 0.25,
  maintain: 0.3,
  gain_muscle: 0.25,
};

const CALORIES_PER_GRAM = {
  protein: 4,
  carbs: 4,
  fat: 9,
} as const;

/**
 * Calcula la Tasa Metabólica Basal (TMB) con la fórmula de
 * Mifflin-St Jeor — el estándar más usado y preciso hoy en
 * día para población general (más actualizada que Harris-
 * Benedict, que es de 1919).
 */
function calculateBMR({ sex, age, weightKg, heightCm }: MacroCalculationInput): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

/**
 * Calcula calorías y macros diarios recomendados a partir de
 * los datos del perfil. Resultado en números enteros, listos
 * para guardar en `macro_goals`.
 */
export function calculateMacros(input: MacroCalculationInput): MacroCalculationResult {
  const bmr = calculateBMR(input);
  const tdee = bmr * ACTIVITY_FACTORS[input.activityLevel];

  const calories = tdee * (1 + CALORIE_ADJUSTMENT[input.goal]);

  const proteinG = PROTEIN_G_PER_KG[input.goal] * input.weightKg;
  const proteinCalories = proteinG * CALORIES_PER_GRAM.protein;

  const fatCalories = calories * FAT_PERCENTAGE[input.goal];
  const fatG = fatCalories / CALORIES_PER_GRAM.fat;

  const carbsCalories = calories - proteinCalories - fatCalories;
  const carbsG = Math.max(carbsCalories, 0) / CALORIES_PER_GRAM.carbs;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories: Math.round(calories),
    proteinG: Math.round(proteinG),
    carbsG: Math.round(carbsG),
    fatG: Math.round(fatG),
  };
}
