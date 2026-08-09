"use client";

import { useState, useTransition } from "react";
import { deleteFoodEntry } from "@/app/food/actions";
import { FoodEntryForm } from "@/app/food/food-entry-form";
import { sumTotals } from "@/lib/nutrition/meal-types";
import type { MealType } from "@/lib/supabase/database.types";

export interface FoodEntryData {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export function MealSection({
  mealType,
  label,
  entries,
}: {
  mealType: MealType;
  label: string;
  entries: FoodEntryData[];
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totals = sumTotals(entries);

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteFoodEntry(id);
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-center justify-between px-4 py-3.5">
        <h2 className="text-base font-semibold">{label}</h2>
      </div>

      <div className="grid grid-cols-4 gap-2 border-t border-border px-3 py-3.5 text-center sm:gap-3 sm:px-4 sm:py-4">
        <TotalStat value={totals.carbsG} label="Carbohidratos" shortLabel="Carbos" colorVar="--color-carbs" />
        <TotalStat value={totals.proteinG} label="Proteínas" shortLabel="Prot." colorVar="--color-protein" />
        <TotalStat value={totals.fatG} label="Grasas" shortLabel="Grasas" colorVar="--color-fat" />
        <TotalStat value={totals.calories} label="Calorías" shortLabel="Cal." colorVar="--color-calories" />
      </div>

      {entries.length > 0 && (
        <ul className="space-y-2 border-t border-border px-4 py-3.5">
          {entries.map((entry) =>
            editingId === entry.id ? (
              <li key={entry.id}>
                <FoodEntryForm
                  mealType={mealType}
                  mode="edit"
                  defaults={{
                    entryId: entry.id,
                    name: entry.name,
                    quantity: entry.quantity,
                    unit: entry.unit,
                    calories: entry.calories,
                    proteinG: entry.protein_g,
                    carbsG: entry.carbs_g,
                    fatG: entry.fat_g,
                  }}
                  onDone={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li
                key={entry.id}
                className="flex flex-col gap-1.5 rounded-xl bg-surface-elevated px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{entry.name}</p>
                  <p className="text-xs text-muted">
                    {entry.quantity} {entry.unit}
                  </p>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                  <p className="tabular-data text-sm whitespace-nowrap">
                    {Math.round(entry.calories)} kcal
                  </p>
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingId(entry.id)}
                      className="text-xs whitespace-nowrap text-muted underline underline-offset-4 hover:text-foreground"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDelete(entry.id)}
                      className="text-xs whitespace-nowrap text-negative underline underline-offset-4 hover:opacity-70 disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </li>
            )
          )}
        </ul>
      )}

      <div className="border-t border-border p-3">
        {showAddForm ? (
          <FoodEntryForm mealType={mealType} mode="add" onDone={() => setShowAddForm(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium text-calories transition-opacity hover:opacity-80"
          >
            <span className="text-base leading-none">+</span> Añadir alimento
          </button>
        )}
      </div>
    </section>
  );
}

function TotalStat({
  value,
  label,
  shortLabel,
  colorVar,
}: {
  value: number;
  label: string;
  shortLabel: string;
  colorVar: string;
}) {
  return (
    <div className="min-w-0">
      <p
        className="tabular-data truncate text-sm font-bold sm:text-lg"
        style={{ color: `var(${colorVar})` }}
      >
        {Math.round(value)}
      </p>
      <p className="mt-0.5 truncate text-[10px] leading-tight text-muted sm:text-[11px]">
        <span className="sm:hidden">{shortLabel}</span>
        <span className="hidden sm:inline">{label}</span>
      </p>
    </div>
  );
}
