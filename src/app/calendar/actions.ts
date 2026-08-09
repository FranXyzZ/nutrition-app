"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayDateString, sumTotals, type FoodTotals } from "@/lib/nutrition/meal-types";

export interface CheckinActionResult {
  success: boolean;
  error?: string;
  checked?: boolean;
}

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");

/**
 * Alterna el check-in de "comí bien" para un día. Si ya existía lo
 * borra (des-marca), si no existía lo crea. Nunca deja marcar un
 * día futuro — no tiene sentido hacer check-in de algo que todavía
 * no pasó. Esta acción SOLO se dispara desde el botón "Hacer
 * check-in este día", nunca al tocar un día en la grilla.
 */
export async function toggleDayCheckin(dateString: string): Promise<CheckinActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No hay una sesión activa." };
  }

  const parsed = dateSchema.safeParse(dateString);
  if (!parsed.success) {
    return { success: false, error: "Fecha inválida." };
  }

  const date = parsed.data;
  const today = todayDateString();

  if (date > today) {
    return { success: false, error: "No podés marcar un día futuro." };
  }

  const { data: existing, error: findError } = await supabase
    .from("day_checkins")
    .select("id")
    .eq("user_id", user.id)
    .eq("checkin_date", date)
    .maybeSingle();

  if (findError) {
    console.error("Error buscando checkin:", findError.message);
    return { success: false, error: "No se pudo actualizar el día." };
  }

  if (existing) {
    const { error: deleteError } = await supabase
      .from("day_checkins")
      .delete()
      .eq("id", existing.id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error borrando checkin:", deleteError.message);
      return { success: false, error: "No se pudo actualizar el día." };
    }

    revalidatePath("/calendar");
    revalidatePath("/settings");
    return { success: true, checked: false };
  }

  const { error: insertError } = await supabase.from("day_checkins").insert({
    user_id: user.id,
    checkin_date: date,
    ate_well: true,
  });

  if (insertError) {
    console.error("Error creando checkin:", insertError.message);
    return { success: false, error: "No se pudo actualizar el día." };
  }

  revalidatePath("/calendar");
  revalidatePath("/settings");
  return { success: true, checked: true };
}

export interface DayMacrosResult {
  success: boolean;
  error?: string;
  totals?: FoodTotals;
}

/**
 * Trae los macros totales registrados en un día puntual (no el de
 * hoy necesariamente). Se usa al tocar un día del calendario, para
 * mostrar arriba "qué comiste" ese día — nunca modifica nada.
 */
export async function getDayMacros(dateString: string): Promise<DayMacrosResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No hay una sesión activa." };
  }

  const parsed = dateSchema.safeParse(dateString);
  if (!parsed.success) {
    return { success: false, error: "Fecha inválida." };
  }

  const date = parsed.data;

  const { data: meals, error: mealsError } = await supabase
    .from("meals")
    .select("id")
    .eq("user_id", user.id)
    .eq("logged_date", date);

  if (mealsError) {
    console.error("Error buscando meals del día:", mealsError.message);
    return { success: false, error: "No se pudieron cargar los datos de ese día." };
  }

  const mealIds = (meals ?? []).map((m) => m.id);

  if (mealIds.length === 0) {
    return {
      success: true,
      totals: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    };
  }

  const { data: entries, error: entriesError } = await supabase
    .from("food_entries")
    .select("calories, protein_g, carbs_g, fat_g")
    .in("meal_id", mealIds);

  if (entriesError) {
    console.error("Error buscando food_entries del día:", entriesError.message);
    return { success: false, error: "No se pudieron cargar los datos de ese día." };
  }

  return { success: true, totals: sumTotals(entries ?? []) };
}
