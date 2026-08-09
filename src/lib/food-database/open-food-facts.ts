// Cliente de Open Food Facts — base de datos de alimentos libre y
// sin API key, usada tanto para buscar por nombre como por código
// de barras. Los macros que devuelve son siempre "por 100g", que es
// como Open Food Facts normaliza los datos de cualquier producto —
// nosotros escalamos según la cantidad que cargue el usuario.

export interface FoodProduct {
  id: string; // código de barras (EAN/UPC)
  name: string;
  brand: string | null;
  imageUrl: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

// Open Food Facts pide un User-Agent descriptivo por política de uso.
const USER_AGENT = "NutritionApp/1.0 (contacto@example.com)";

interface OffNutriments {
  "energy-kcal_100g"?: number;
  "energy-kcal"?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
}

interface OffProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  nutriments?: OffNutriments;
  image_front_small_url?: string;
  image_small_url?: string;
}

function mapProduct(raw: OffProduct): FoodProduct | null {
  const nutriments = raw.nutriments;
  const calories = nutriments?.["energy-kcal_100g"] ?? nutriments?.["energy-kcal"];

  // Sin calorías no hay nada útil que precargar — lo tratamos como
  // "no encontrado" para que el usuario caiga a carga manual.
  if (!raw.code || !raw.product_name || calories == null) {
    return null;
  }

  return {
    id: raw.code,
    name: raw.product_name,
    brand: raw.brands?.split(",")[0]?.trim() || null,
    imageUrl: raw.image_front_small_url || raw.image_small_url || null,
    caloriesPer100g: Math.round(calories),
    proteinPer100g: Math.round((nutriments?.proteins_100g ?? 0) * 10) / 10,
    carbsPer100g: Math.round((nutriments?.carbohydrates_100g ?? 0) * 10) / 10,
    fatPer100g: Math.round((nutriments?.fat_100g ?? 0) * 10) / 10,
  };
}

const SEARCH_FIELDS = "code,product_name,brands,nutriments,image_front_small_url,image_small_url";

export async function searchFoodProducts(query: string): Promise<FoodProduct[]> {
  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  url.searchParams.set("search_terms", query);
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", "20");
  url.searchParams.set("fields", SEARCH_FIELDS);
  // Ordena por popularidad (cantidad de escaneos) para que las marcas
  // más conocidas/compradas (Nestlé, Watts, Soprole, Danone, etc.)
  // salgan primero en vez de resultados random de mala calidad de datos.
  url.searchParams.set("sort_by", "unique_scans_n");

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(6000),
  });

  if (!res.ok) {
    throw new Error(`Open Food Facts respondió ${res.status}`);
  }

  const data = (await res.json()) as { products?: OffProduct[] };
  const products = (data.products ?? [])
    .map(mapProduct)
    .filter((p): p is FoodProduct => p !== null);

  // Dedup por nombre+marca — la búsqueda de OFF suele repetir el
  // mismo producto en variantes de packaging casi idénticas.
  const seen = new Set<string>();
  return products.filter((p) => {
    const key = `${p.name.toLowerCase()}|${p.brand?.toLowerCase() ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function getFoodProductByBarcode(barcode: string): Promise<FoodProduct | null> {
  const url = new URL(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
  url.searchParams.set("fields", SEARCH_FIELDS);

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(6000),
  });

  if (!res.ok) {
    throw new Error(`Open Food Facts respondió ${res.status}`);
  }

  const data = (await res.json()) as { status: number; product?: OffProduct };
  if (data.status !== 1 || !data.product) {
    return null;
  }

  return mapProduct(data.product);
}
