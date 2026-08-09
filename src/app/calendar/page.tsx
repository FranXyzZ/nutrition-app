import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayDateString } from "@/lib/nutrition/meal-types";
import { CalendarView, type CalendarDay, type MacroGoals } from "@/app/calendar/calendar-view";

const MONTH_LABELS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function parseMonthParam(month?: string): { year: number; monthIndex: number } {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    if (m >= 1 && m <= 12) {
      return { year: y, monthIndex: m - 1 };
    }
  }
  const now = new Date();
  return { year: now.getFullYear(), monthIndex: now.getMonth() };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { month } = await searchParams;
  const { year, monthIndex } = parseMonthParam(month);

  const firstOfMonth = `${year}-${pad(monthIndex + 1)}-01`;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const lastOfMonth = `${year}-${pad(monthIndex + 1)}-${pad(daysInMonth)}`;

  const [{ data: checkins }, { data: goalsRow }] = await Promise.all([
    supabase
      .from("day_checkins")
      .select("checkin_date")
      .eq("user_id", user.id)
      .gte("checkin_date", firstOfMonth)
      .lte("checkin_date", lastOfMonth),
    supabase.from("macro_goals").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const goals: MacroGoals | null = goalsRow
    ? {
        calories: goalsRow.calories,
        proteinG: goalsRow.protein_g,
        carbsG: goalsRow.carbs_g,
        fatG: goalsRow.fat_g,
      }
    : null;

  const checkedDates = new Set((checkins ?? []).map((c) => c.checkin_date));
  const today = todayDateString();

  // Lunes = 0 ... Domingo = 6
  const firstWeekday = (new Date(year, monthIndex, 1).getDay() + 6) % 7;

  const days: CalendarDay[] = [];
  for (let i = 0; i < firstWeekday; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateString = `${year}-${pad(monthIndex + 1)}-${pad(d)}`;
    days.push({
      date: dateString,
      dayNumber: d,
      isToday: dateString === today,
      isFuture: dateString > today,
      isChecked: checkedDates.has(dateString),
    });
  }
  while (days.length % 7 !== 0) {
    days.push(null);
  }

  const pastOrTodayCount = days.filter((d) => d && !d.isFuture).length;
  const checkedCount = checkedDates.size;

  const prevDate = new Date(year, monthIndex - 1, 1);
  const nextDate = new Date(year, monthIndex + 1, 1);
  const prevMonthParam = `${prevDate.getFullYear()}-${pad(prevDate.getMonth() + 1)}`;
  const nextMonthParam = `${nextDate.getFullYear()}-${pad(nextDate.getMonth() + 1)}`;

  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && monthIndex === now.getMonth();

  return (
    <main className="pb-nav mx-auto max-w-lg space-y-4 px-4 py-6 sm:max-w-2xl sm:px-6 sm:py-10">
      <CalendarView
        key={`${year}-${monthIndex}`}
        monthLabel={`${MONTH_LABELS[monthIndex]} ${year}`}
        days={days}
        prevMonthParam={prevMonthParam}
        nextMonthParam={nextMonthParam}
        isCurrentMonth={isCurrentMonth}
        checkedCount={checkedCount}
        pastOrTodayCount={pastOrTodayCount}
        goals={goals}
        today={today}
      />
    </main>
  );
}
