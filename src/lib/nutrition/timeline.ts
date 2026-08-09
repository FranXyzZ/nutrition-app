export interface TimelinePoint {
  timestamp: number;
  time: string; // etiqueta "HH:mm"
  caloriesG: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  caloriesPct: number;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
}

interface GoalsInput {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

interface EntryInput {
  logged_at: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function toPct(value: number, goal: number): number {
  if (!goal || goal <= 0) return 0;
  return Math.round((value / goal) * 1000) / 10;
}

/**
 * Arma la serie de tiempo acumulada del día, tipo "equity curve":
 * arranca en 0 a las 00:00, suma cada food_entry en el orden en
 * que se registró, y cierra con un punto en el momento actual
 * (manteniendo el último valor plano) para que la línea siempre
 * llegue hasta "ahora". Los valores se expresan tanto en unidad
 * cruda (kcal/g, para el tooltip) como en % del objetivo diario
 * (para el eje Y, que así es comparable entre las 4 macros).
 */
export function buildDailyTimeline(
  entries: EntryInput[],
  goals: GoalsInput | null
): TimelinePoint[] {
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);

  const points: TimelinePoint[] = [];

  const pushPoint = (date: Date, cal: number, pro: number, carb: number, fat: number) => {
    points.push({
      timestamp: date.getTime(),
      time: formatTime(date),
      caloriesG: Math.round(cal),
      proteinG: Math.round(pro),
      carbsG: Math.round(carb),
      fatG: Math.round(fat),
      caloriesPct: toPct(cal, goals?.calories ?? 0),
      proteinPct: toPct(pro, goals?.protein_g ?? 0),
      carbsPct: toPct(carb, goals?.carbs_g ?? 0),
      fatPct: toPct(fat, goals?.fat_g ?? 0),
    });
  };

  pushPoint(dayStart, 0, 0, 0, 0);

  let cal = 0;
  let pro = 0;
  let carb = 0;
  let fat = 0;

  for (const entry of entries) {
    cal += Number(entry.calories);
    pro += Number(entry.protein_g);
    carb += Number(entry.carbs_g);
    fat += Number(entry.fat_g);
    pushPoint(new Date(entry.logged_at), cal, pro, carb, fat);
  }

  const lastPoint = points[points.length - 1];
  if (lastPoint.timestamp < now.getTime()) {
    pushPoint(now, cal, pro, carb, fat);
  }

  return points;
}
