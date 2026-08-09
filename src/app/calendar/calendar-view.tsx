"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { toggleDayCheckin, getDayMacros } from "@/app/calendar/actions";
import { DaySummary } from "@/app/dashboard/day-summary";
import type { FoodTotals } from "@/lib/nutrition/meal-types";

export type CalendarDay = {
  date: string;
  dayNumber: number;
  isToday: boolean;
  isFuture: boolean;
  isChecked: boolean;
} | null;

export interface MacroGoals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
const ZERO_TOTALS: FoodTotals = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };

function formatDayLabel(dateString: string, today: string) {
  if (dateString === today) return "Hoy";
  const date = new Date(`${dateString}T00:00:00`);
  const formatted = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function CalendarView({
  monthLabel,
  days,
  prevMonthParam,
  nextMonthParam,
  isCurrentMonth,
  checkedCount,
  pastOrTodayCount,
  goals,
  today,
}: {
  monthLabel: string;
  days: CalendarDay[];
  prevMonthParam: string;
  nextMonthParam: string;
  isCurrentMonth: boolean;
  checkedCount: number;
  pastOrTodayCount: number;
  goals: MacroGoals | null;
  today: string;
}) {
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(days.filter((d) => d?.isChecked).map((d) => d!.date))
  );

  const initialSelected = isCurrentMonth
    ? (days.find((d) => d?.isToday)?.date ?? null)
    : null;
  const [selectedDate, setSelectedDate] = useState<string | null>(initialSelected);
  const [totals, setTotals] = useState<FoodTotals>(ZERO_TOTALS);
  const [isLoadingTotals, startLoadingTotals] = useTransition();
  const [isSavingCheckin, startSavingCheckin] = useTransition();

  // Al tocar un día se piden sus macros — nunca se hace check-in
  // automático acá, eso solo pasa con el botón de abajo.
  function handleSelectDay(date: string) {
    setSelectedDate(date);
    startLoadingTotals(async () => {
      const result = await getDayMacros(date);
      setTotals(result.success && result.totals ? result.totals : ZERO_TOTALS);
    });
  }

  useEffect(() => {
    if (initialSelected) {
      handleSelectDay(initialSelected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCheckinClick() {
    if (!selectedDate) return;
    const wasChecked = checked.has(selectedDate);

    setChecked((prev) => {
      const next = new Set(prev);
      if (wasChecked) {
        next.delete(selectedDate);
      } else {
        next.add(selectedDate);
      }
      return next;
    });

    startSavingCheckin(async () => {
      const result = await toggleDayCheckin(selectedDate);
      if (!result.success) {
        setChecked((prev) => {
          const next = new Set(prev);
          if (wasChecked) {
            next.add(selectedDate);
          } else {
            next.delete(selectedDate);
          }
          return next;
        });
      }
    });
  }

  const selectedIsChecked = selectedDate ? checked.has(selectedDate) : false;
  const selectedIsFuture = selectedDate ? selectedDate > today : false;

  return (
    <div className="space-y-4">
      {/* Sección chica de arriba: macros del día seleccionado */}
      <section>
        <p className="mb-2 px-1 text-xs font-medium text-muted">
          {selectedDate ? formatDayLabel(selectedDate, today) : "Tocá un día del calendario"}
        </p>
        {goals ? (
          <div className={isLoadingTotals ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <DaySummary
              carbsConsumed={totals.carbsG}
              carbsGoal={goals.carbsG}
              proteinConsumed={totals.proteinG}
              proteinGoal={goals.proteinG}
              fatConsumed={totals.fatG}
              fatGoal={goals.fatG}
              caloriesConsumed={totals.calories}
              caloriesGoal={goals.calories}
            />
          </div>
        ) : (
          <p className="rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-muted">
            Todavía no configuraste tus objetivos.{" "}
            <a href="/onboarding" className="underline underline-offset-4">
              Completá tu perfil
            </a>{" "}
            para ver tu progreso acá.
          </p>
        )}
      </section>

      {/* Sección grande: el calendario */}
      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <Link
            href={`/calendar?month=${prevMonthParam}`}
            aria-label="Mes anterior"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
          >
            <ChevronIcon direction="left" />
          </Link>

          <h2 className="text-lg font-semibold capitalize sm:text-xl">{monthLabel}</h2>

          {isCurrentMonth ? (
            <span className="h-9 w-9 shrink-0" />
          ) : (
            <Link
              href={`/calendar?month=${nextMonthParam}`}
              aria-label="Mes siguiente"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
            >
              <ChevronIcon direction="right" />
            </Link>
          )}
        </div>

        <p className="tabular-data mt-1 text-center text-xs text-muted">
          {checkedCount} de {pastOrTodayCount} {pastOrTodayCount === 1 ? "día" : "días"} con check-in
        </p>

        <div className="mt-5 grid grid-cols-7 gap-1.5 text-center sm:gap-2">
          {WEEKDAY_LABELS.map((label, i) => (
            <div key={i} className="text-xs font-medium text-muted">
              {label}
            </div>
          ))}

          {days.map((day, i) => {
            if (!day) {
              return <div key={`blank-${i}`} />;
            }

            const isChecked = checked.has(day.date);
            const isSelected = selectedDate === day.date;

            return (
              <button
                key={day.date}
                type="button"
                disabled={day.isFuture}
                onClick={() => handleSelectDay(day.date)}
                aria-pressed={isSelected}
                aria-label={`${day.dayNumber}${isChecked ? " — comiste bien ese día" : ""}`}
                className={[
                  "tabular-data relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl text-sm font-medium transition-colors sm:text-base",
                  day.isFuture
                    ? "cursor-not-allowed text-muted/40"
                    : "hover:bg-surface-elevated active:opacity-70",
                  isSelected && !day.isFuture ? "bg-surface-elevated ring-2 ring-calories" : "",
                  !isSelected && day.isToday ? "ring-1 ring-inset ring-border" : "",
                ].join(" ")}
              >
                <span>{day.dayNumber}</span>
                {isChecked && (
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-calories text-black sm:h-4 sm:w-4">
                    <CheckIcon />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted">
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-calories text-black">
            <CheckIcon />
          </span>
          Comiste bien ese día
        </div>

        {selectedDate && !selectedIsFuture && (
          <button
            type="button"
            onClick={handleCheckinClick}
            disabled={isSavingCheckin}
            className={[
              "mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl py-3.5 text-sm font-semibold transition-opacity active:opacity-80 disabled:opacity-50",
              selectedIsChecked
                ? "border border-border text-foreground hover:bg-surface-elevated"
                : "bg-calories text-black",
            ].join(" ")}
          >
            {isSavingCheckin
              ? "Guardando…"
              : selectedIsChecked
                ? "Quitar check-in de este día"
                : "Hacer check-in este día"}
          </button>
        )}
      </section>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-2.5 w-2.5"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      {direction === "left" ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
    </svg>
  );
}
