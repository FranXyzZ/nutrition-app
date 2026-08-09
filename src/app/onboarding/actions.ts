"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { calculateMacros } from "@/lib/nutrition/calculate-macros";

const profileSchema = z.object({
  age: z.coerce.number().int().min(13, "La edad mínima es 13 años").max(100),
  sex: z.enum(["male", "female"]),
  weightKg: z.coerce.number().min(30).max(300),
  heightCm: z.coerce.number().min(100).max(250),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  goal: z.enum(["lose_fat", "maintain", "gain_muscle"]),
});

export interface SaveProfileResult {
  success: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof profileSchema>, string>>;
  macros?: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
}

export async function saveProfileAndCalculateMacros(
  formData: FormData
): Promise<SaveProfileResult> {
  const supabase = await createClient();

  // El user_id SIEMPRE sale de la sesión autenticada en el
  // servidor, nunca de un campo del formulario.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No hay una sesión activa. Iniciá sesión de nuevo." };
  }

  const parsed = profileSchema.safeParse({
    age: formData.get("age"),
    sex: formData.get("sex"),
    weightKg: formData.get("weightKg"),
    heightCm: formData.get("heightCm"),
    activityLevel: formData.get("activityLevel"),
    goal: formData.get("goal"),
  });

  if (!parsed.success) {
    const fieldErrors: SaveProfileResult["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof z.infer<typeof profileSchema>;
      fieldErrors[key] = issue.message;
    }
    return { success: false, error: "Revisá los datos ingresados.", fieldErrors };
  }

  const { age, sex, weightKg, heightCm, activityLevel, goal } = parsed.data;

  // 1. Guardar el perfil
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      age,
      sex,
      weight_kg: weightKg,
      height_cm: heightCm,
      activity_level: activityLevel,
      goal,
    })
    .eq("id", user.id);

  if (profileError) {
    // No exponemos el error interno de Postgres al cliente.
    console.error("Error guardando perfil:", profileError.message);
    return { success: false, error: "No se pudo guardar el perfil. Intentá de nuevo." };
  }

  // 2. Calcular macros a partir de los datos recién guardados
  const macros = calculateMacros({ sex, age, weightKg, heightCm, activityLevel, goal });

  // 3. Guardar/actualizar macro_goals — solo si el usuario no
  //    los había personalizado a mano (is_custom = true).
  const { data: existingGoals } = await supabase
    .from("macro_goals")
    .select("is_custom")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingGoals?.is_custom) {
    // Respetamos los valores manuales del usuario, no los pisamos.
    return { success: true };
  }

  const { error: goalsError } = await supabase.from("macro_goals").upsert(
    {
      user_id: user.id,
      calories: macros.calories,
      protein_g: macros.proteinG,
      carbs_g: macros.carbsG,
      fat_g: macros.fatG,
      is_custom: false,
    },
    { onConflict: "user_id" }
  );

  if (goalsError) {
    console.error("Error guardando macro_goals:", goalsError.message);
    return { success: false, error: "Perfil guardado, pero no se pudieron calcular los macros." };
  }

  return {
    success: true,
    macros: {
      calories: macros.calories,
      proteinG: macros.proteinG,
      carbsG: macros.carbsG,
      fatG: macros.fatG,
    },
  };
}

const customGoalsSchema = z.object({
  calories: z.coerce.number().int().min(800, "Mínimo saludable: 800 kcal").max(10000),
  proteinG: z.coerce.number().int().min(0).max(1000),
  carbsG: z.coerce.number().int().min(0).max(2000),
  fatG: z.coerce.number().int().min(0).max(500),
});

export interface SaveCustomGoalsResult {
  success: boolean;
  error?: string;
}

/**
 * Guarda los macros ajustados manualmente por el usuario.
 * Marca is_custom = true para que el recálculo automático
 * (al editar el perfil) no los vuelva a pisar.
 */
export async function saveCustomGoals(formData: FormData): Promise<SaveCustomGoalsResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "No hay una sesión activa. Iniciá sesión de nuevo." };
  }

  const parsed = customGoalsSchema.safeParse({
    calories: formData.get("calories"),
    proteinG: formData.get("proteinG"),
    carbsG: formData.get("carbsG"),
    fatG: formData.get("fatG"),
  });

  if (!parsed.success) {
    return { success: false, error: "Revisá los valores ingresados." };
  }

  const { calories, proteinG, carbsG, fatG } = parsed.data;

  const { error } = await supabase.from("macro_goals").upsert(
    {
      user_id: user.id,
      calories,
      protein_g: proteinG,
      carbs_g: carbsG,
      fat_g: fatG,
      is_custom: true,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("Error guardando objetivos personalizados:", error.message);
    return { success: false, error: "No se pudieron guardar los cambios." };
  }

  return { success: true };
}
