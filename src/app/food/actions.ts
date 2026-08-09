"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayDateString } from "@/lib/nutrition/meal-types";
import type { MealType } from "@/lib/supabase/database.types";

const foodEntrySchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  quantity: z.coerce.number().positive("Tiene que ser mayor a 0"),
  unit: z.string().trim().min(1, "La unidad es obligatoria").max(30),
  calories: z.coerce.number().min(0).max(20000),
  proteinG: z.coerce.number().min(0).max(2000),
  carbsG: z.coerce.number().min(0).max(2000),
  fatG: z.coerce.number().min(0).max(2000),
});

export interface FoodActionResult {
  success: boolean;
  error?: string;
}

/**
 * Busca la comida (meal) del usuario para ese tipo+fecha, o la
 * crea si todavía no existe. Nunca confía en un meal_id que
 * venga del cliente para esta parte: arma o busca el registro
 * él mismo, scoped siempre al user_id de la sesión.
 */
async function getOrCreateMealId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  mealType: MealType,
  logDate: string
): Promise<{ mealId: string | null; error: string | null }> {
  const { data: existing, error: findError } = await supabase
    .from("meals")
    .select("id")
    .eq("user_id", userId)
    .eq("meal_type", mealType)
    .eq("logged_date", logDate)
    .maybeSingle();

  if (findError) {
    return { mealId: null, error: findError.message };
  }

  if (existing) {
    return { mealId: existing.id, error: null };
  }

  const { data: created, error: createError } = await supabase
    .from("meals")
    .insert({ user_id: userId, meal_type: mealType, logged_date: logDate })
    .select("id")
    .single();

  if (createError || !created) {
    return { mealId: null, error: createError?.message ?? "No se pudo crear la comida." };
  }

  return { mealId: created.id, error: null };
}

export async function addFoodEntry(formData: FormData): Promise<FoodActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No hay una sesión activa." };
  }

  const mealType = formData.get("mealType") as MealType | null;
  if (!mealType || !["breakfast", "lunch", "dinner", "snack"].includes(mealType)) {
    return { success: false, error: "Tipo de comida inválido." };
  }

  const parsed = foodEntrySchema.safeParse({
    name: formData.get("name"),
    quantity: formData.get("quantity"),
    unit: formData.get("unit"),
    calories: formData.get("calories"),
    proteinG: formData.get("proteinG"),
    carbsG: formData.get("carbsG"),
    fatG: formData.get("fatG"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const logDate = todayDateString();

  const { mealId, error: mealError } = await getOrCreateMealId(
    supabase,
    user.id,
    mealType,
    logDate
  );

  if (!mealId) {
    console.error("Error creando/buscando meal:", mealError);
    return { success: false, error: "No se pudo registrar el alimento." };
  }

  const { name, quantity, unit, calories, proteinG, carbsG, fatG } = parsed.data;

  const { error: insertError } = await supabase.from("food_entries").insert({
    user_id: user.id,
    meal_id: mealId,
    name,
    quantity,
    unit,
    calories,
    protein_g: proteinG,
    carbs_g: carbsG,
    fat_g: fatG,
    logged_at: new Date().toISOString(),
  });

  if (insertError) {
    console.error("Error insertando food_entry:", insertError.message);
    return { success: false, error: "No se pudo registrar el alimento." };
  }

  revalidatePath("/food");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateFoodEntry(formData: FormData): Promise<FoodActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No hay una sesión activa." };
  }

  const entryId = formData.get("entryId");
  if (typeof entryId !== "string" || !entryId) {
    return { success: false, error: "Alimento inválido." };
  }

  const parsed = foodEntrySchema.safeParse({
    name: formData.get("name"),
    quantity: formData.get("quantity"),
    unit: formData.get("unit"),
    calories: formData.get("calories"),
    proteinG: formData.get("proteinG"),
    carbsG: formData.get("carbsG"),
    fatG: formData.get("fatG"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { name, quantity, unit, calories, proteinG, carbsG, fatG } = parsed.data;

  // El .eq("user_id", user.id) es defensa en profundidad —
  // RLS ya lo garantiza en la base, pero lo dejamos explícito
  // acá también para que la intención quede clara en el código.
  const { error } = await supabase
    .from("food_entries")
    .update({
      name,
      quantity,
      unit,
      calories,
      protein_g: proteinG,
      carbs_g: carbsG,
      fat_g: fatG,
    })
    .eq("id", entryId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error actualizando food_entry:", error.message);
    return { success: false, error: "No se pudo actualizar el alimento." };
  }

  revalidatePath("/food");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteFoodEntry(entryId: string): Promise<FoodActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No hay una sesión activa." };
  }

  const { error } = await supabase
    .from("food_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error eliminando food_entry:", error.message);
    return { success: false, error: "No se pudo eliminar el alimento." };
  }

  revalidatePath("/food");
  revalidatePath("/dashboard");
  return { success: true };
}
