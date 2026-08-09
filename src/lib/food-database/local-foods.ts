// Base local de alimentos comunes — vive en el código, no depende de
// ningún servicio externo. Existe porque Open Food Facts (base de
// datos colaborativa) tiene dos límites que no controlamos:
//   1. Solo tiene lo que alguien haya cargado ahí antes.
//   2. Limita a 10 búsquedas/minuto por IP, y esa IP suele ser
//      compartida con miles de otras apps en el hosting (Vercel).
// Para alimentos genéricos súper comunes (pollo, arroz, yogurt,
// proteína en polvo, etc.) no tiene sentido depender de eso: los
// dejamos acá, con valores de referencia estándar (aprox. por 100g,
// basados en tablas de composición de alimentos ampliamente usadas
// tipo USDA). Quedan como punto de partida rápido — el usuario
// siempre puede ajustar los macros a mano si su producto específico
// difiere (ej. una marca particular).
//
// Para agregar un alimento nuevo: sumar una entrada acá. Es la forma
// más simple de ir ampliando esto con productos chilenos específicos
// a medida que los vayamos necesitando.

import type { FoodProduct } from "./open-food-facts";

interface LocalFood {
  id: string;
  name: string;
  // Términos alternativos por los que también debería aparecer este
  // alimento (sin tildes, en minúscula — normalizeText se encarga
  // del resto). No hace falta repetir palabras que ya están en name.
  aliases?: string[];
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

const LOCAL_FOODS: LocalFood[] = [
  // Proteínas / carnes / huevo
  { id: "local-pechuga-pollo", name: "Pechuga de pollo (cruda)", aliases: ["pollo"], caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
  { id: "local-pollo-cocido", name: "Pechuga de pollo (cocida)", aliases: ["pollo cocido", "pollo a la plancha"], caloriesPer100g: 195, proteinPer100g: 29, carbsPer100g: 0, fatPer100g: 7.7 },
  { id: "local-carne-molida", name: "Carne molida de vacuno (5% grasa)", aliases: ["carne", "vacuno", "carne molida"], caloriesPer100g: 137, proteinPer100g: 21, carbsPer100g: 0, fatPer100g: 5 },
  { id: "local-lomo-vetado", name: "Lomo vetado (crudo)", aliases: ["lomo", "vacuno"], caloriesPer100g: 230, proteinPer100g: 22, carbsPer100g: 0, fatPer100g: 16 },
  { id: "local-pavo", name: "Pechuga de pavo (cruda)", aliases: ["pavo"], caloriesPer100g: 135, proteinPer100g: 30, carbsPer100g: 0, fatPer100g: 1.7 },
  { id: "local-huevo", name: "Huevo entero", aliases: ["huevos"], caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11 },
  { id: "local-clara-huevo", name: "Clara de huevo", aliases: ["claras"], caloriesPer100g: 52, proteinPer100g: 11, carbsPer100g: 0.7, fatPer100g: 0.2 },
  { id: "local-salmon", name: "Salmón (crudo)", aliases: [], caloriesPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13 },
  { id: "local-atun-agua", name: "Atún en agua (lata, escurrido)", aliases: ["atun"], caloriesPer100g: 116, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 1 },
  { id: "local-merluza", name: "Merluza (cruda)", aliases: ["pescado"], caloriesPer100g: 90, proteinPer100g: 17.7, carbsPer100g: 0, fatPer100g: 1.5 },

  // Proteína en polvo / suplementos
  { id: "local-proteina-whey", name: "Proteína en polvo (whey, genérica)", aliases: ["proteina", "protein", "whey"], caloriesPer100g: 380, proteinPer100g: 75, carbsPer100g: 8, fatPer100g: 6 },
  { id: "local-proteina-vegetal", name: "Proteína en polvo (vegetal, genérica)", aliases: ["proteina vegana", "proteina plant based"], caloriesPer100g: 370, proteinPer100g: 70, carbsPer100g: 10, fatPer100g: 6 },

  // Lácteos
  { id: "local-yogurt-natural", name: "Yogurt natural entero", aliases: ["yogur", "yoghurt", "yogurt"], caloriesPer100g: 61, proteinPer100g: 3.5, carbsPer100g: 4.7, fatPer100g: 3.3 },
  { id: "local-yogurt-griego", name: "Yogurt griego natural", aliases: ["yogur griego", "yoghurt griego"], caloriesPer100g: 97, proteinPer100g: 9, carbsPer100g: 3.9, fatPer100g: 5 },
  { id: "local-yogurt-descremado", name: "Yogurt natural descremado", aliases: ["yogur light", "yogurt light", "yogurt sin azucar"], caloriesPer100g: 41, proteinPer100g: 4, carbsPer100g: 5.7, fatPer100g: 0.2 },
  { id: "local-leche-entera", name: "Leche entera", aliases: ["leche"], caloriesPer100g: 61, proteinPer100g: 3.2, carbsPer100g: 4.8, fatPer100g: 3.3 },
  { id: "local-leche-descremada", name: "Leche descremada", aliases: ["leche light", "leche desnatada"], caloriesPer100g: 34, proteinPer100g: 3.4, carbsPer100g: 5, fatPer100g: 0.1 },
  { id: "local-queso-fresco", name: "Queso fresco", aliases: ["queso"], caloriesPer100g: 264, proteinPer100g: 18, carbsPer100g: 3.4, fatPer100g: 21 },
  { id: "local-queso-cottage", name: "Queso cottage", aliases: ["cottage"], caloriesPer100g: 98, proteinPer100g: 11, carbsPer100g: 3.4, fatPer100g: 4.3 },

  // Carbohidratos
  { id: "local-arroz-blanco", name: "Arroz blanco (cocido)", aliases: ["arroz"], caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3 },
  { id: "local-fideos", name: "Fideos / pasta (cocidos)", aliases: ["pasta", "tallarines", "fideos"], caloriesPer100g: 131, proteinPer100g: 5, carbsPer100g: 25, fatPer100g: 1.1 },
  { id: "local-pan-marraqueta", name: "Pan marraqueta", aliases: ["pan"], caloriesPer100g: 274, proteinPer100g: 9, carbsPer100g: 53, fatPer100g: 2 },
  { id: "local-pan-integral", name: "Pan integral", aliases: ["pan integral"], caloriesPer100g: 247, proteinPer100g: 13, carbsPer100g: 41, fatPer100g: 3.4 },
  { id: "local-avena", name: "Avena (cruda, en hojuelas)", aliases: ["oats"], caloriesPer100g: 389, proteinPer100g: 17, carbsPer100g: 66, fatPer100g: 7 },
  { id: "local-papa", name: "Papa cocida", aliases: ["patata"], caloriesPer100g: 87, proteinPer100g: 1.9, carbsPer100g: 20, fatPer100g: 0.1 },
  { id: "local-camote", name: "Camote cocido", aliases: ["batata"], caloriesPer100g: 90, proteinPer100g: 2, carbsPer100g: 21, fatPer100g: 0.1 },
  { id: "local-quinoa", name: "Quinoa (cocida)", aliases: [], caloriesPer100g: 120, proteinPer100g: 4.4, carbsPer100g: 21, fatPer100g: 1.9 },

  // Legumbres
  { id: "local-lentejas", name: "Lentejas (cocidas)", aliases: ["lenteja"], caloriesPer100g: 116, proteinPer100g: 9, carbsPer100g: 20, fatPer100g: 0.4 },
  { id: "local-porotos", name: "Porotos (cocidos)", aliases: ["frijoles", "poroto"], caloriesPer100g: 127, proteinPer100g: 9, carbsPer100g: 23, fatPer100g: 0.5 },
  { id: "local-garbanzos", name: "Garbanzos (cocidos)", aliases: ["garbanzo"], caloriesPer100g: 164, proteinPer100g: 9, carbsPer100g: 27, fatPer100g: 2.6 },

  // Frutas
  { id: "local-platano", name: "Plátano", aliases: ["banana"], caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3 },
  { id: "local-manzana", name: "Manzana", aliases: [], caloriesPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2 },
  { id: "local-palta", name: "Palta", aliases: ["aguacate"], caloriesPer100g: 160, proteinPer100g: 2, carbsPer100g: 8.5, fatPer100g: 15 },
  { id: "local-frutillas", name: "Frutillas", aliases: ["fresas"], caloriesPer100g: 32, proteinPer100g: 0.7, carbsPer100g: 7.7, fatPer100g: 0.3 },

  // Verduras
  { id: "local-brocoli", name: "Brócoli (cocido)", aliases: ["brocoli"], caloriesPer100g: 35, proteinPer100g: 2.4, carbsPer100g: 7, fatPer100g: 0.4 },
  { id: "local-espinaca", name: "Espinaca (cruda)", aliases: [], caloriesPer100g: 23, proteinPer100g: 2.9, carbsPer100g: 3.6, fatPer100g: 0.4 },
  { id: "local-zanahoria", name: "Zanahoria (cruda)", aliases: [], caloriesPer100g: 41, proteinPer100g: 0.9, carbsPer100g: 10, fatPer100g: 0.2 },
  { id: "local-lechuga", name: "Lechuga", aliases: [], caloriesPer100g: 15, proteinPer100g: 1.4, carbsPer100g: 2.9, fatPer100g: 0.2 },
  { id: "local-tomate", name: "Tomate", aliases: ["jitomate"], caloriesPer100g: 18, proteinPer100g: 0.9, carbsPer100g: 3.9, fatPer100g: 0.2 },

  // Grasas / frutos secos
  { id: "local-almendras", name: "Almendras", aliases: ["almendra"], caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50 },
  { id: "local-mani", name: "Maní / cacahuate", aliases: ["mani", "cacahuate", "cacahuete"], caloriesPer100g: 567, proteinPer100g: 26, carbsPer100g: 16, fatPer100g: 49 },
  { id: "local-aceite-oliva", name: "Aceite de oliva", aliases: ["aceite"], caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100 },
  { id: "local-mantequilla-mani", name: "Mantequilla de maní", aliases: ["peanut butter", "crema de mani"], caloriesPer100g: 588, proteinPer100g: 25, carbsPer100g: 20, fatPer100g: 50 },
];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // saca tildes
}

function toFoodProduct(food: LocalFood): FoodProduct {
  return {
    id: food.id,
    name: food.name,
    brand: null,
    imageUrl: null,
    caloriesPer100g: food.caloriesPer100g,
    proteinPer100g: food.proteinPer100g,
    carbsPer100g: food.carbsPer100g,
    fatPer100g: food.fatPer100g,
  };
}

export function searchLocalFoods(query: string): FoodProduct[] {
  const q = normalizeText(query.trim());
  if (q.length < 2) return [];

  return LOCAL_FOODS.filter((food) => {
    const haystacks = [food.name, ...(food.aliases ?? [])].map(normalizeText);
    return haystacks.some((h) => h.includes(q));
  }).map(toFoodProduct);
}
