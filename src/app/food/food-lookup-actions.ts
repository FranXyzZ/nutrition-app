"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  searchFoodProducts,
  getFoodProductByBarcode,
  type FoodProduct,
} from "@/lib/food-database/open-food-facts";
import { searchLocalFoods } from "@/lib/food-database/local-foods";

/**
 * Ambas acciones pegan a un servicio externo (Open Food Facts), no
 * a datos del usuario — igual las dejamos detrás de sesión para no
 * exponer un endpoint público de proxy gratis a cualquiera.
 */
async function requireSession(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !!user;
}

export async function searchFoods(query: string): Promise<FoodProduct[]> {
  if (!(await requireSession())) return [];

  const parsed = z.string().trim().min(2).max(100).safeParse(query);
  if (!parsed.success) return [];

  // La base local (alimentos genéricos comunes) siempre responde al
  // instante, sin depender de ningún servicio externo — así "yogurt",
  // "proteína", "pollo", etc. nunca quedan sin resultados.
  const localResults = searchLocalFoods(parsed.data);

  // Open Food Facts suma productos envasados/de marca cuando puede
  // (útil para el escáner de código de barras). Si falla o está sin
  // resultados para este término, no debe tumbar los resultados
  // locales — por eso va en su propio try/catch, separado.
  let externalResults: FoodProduct[] = [];
  try {
    externalResults = await searchFoodProducts(parsed.data);
  } catch (err) {
    console.error("Error buscando alimentos en Open Food Facts:", err);
  }

  const seen = new Set(localResults.map((p) => p.name.toLowerCase()));
  const merged = [
    ...localResults,
    ...externalResults.filter((p) => !seen.has(p.name.toLowerCase())),
  ];

  return merged.slice(0, 20);
}

export async function lookupBarcode(barcode: string): Promise<FoodProduct | null> {
  if (!(await requireSession())) return null;

  const parsed = z
    .string()
    .trim()
    .regex(/^\d{6,14}$/, "Código de barras inválido")
    .safeParse(barcode);
  if (!parsed.success) return null;

  try {
    return await getFoodProductByBarcode(parsed.data);
  } catch (err) {
    console.error("Error buscando código de barras en Open Food Facts:", err);
    return null;
  }
}
