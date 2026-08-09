function CompactStat({
  label,
  shortLabel,
  consumed,
  goal,
  unit,
  colorVar,
}: {
  label: string;
  shortLabel: string;
  consumed: number;
  goal: number;
  unit: string;
  colorVar: string;
}) {
  const pct = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;

  return (
    <div className="min-w-0">
      <p
        className="truncate text-[11px] leading-tight font-semibold tracking-wide"
        style={{ color: `var(${colorVar})` }}
      >
        <span className="sm:hidden">{shortLabel}</span>
        <span className="hidden sm:inline">{label}</span>
      </p>
      <p
        className="tabular-data mt-1 truncate text-[13px] leading-tight font-semibold sm:text-sm"
        style={{ color: `var(${colorVar})` }}
      >
        {Math.round(consumed)}/{Math.round(goal)}
        <span className="ml-0.5 text-[10px] font-medium sm:text-xs">{unit}</span>
      </p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: `var(${colorVar})` }}
        />
      </div>
    </div>
  );
}

export function DaySummary({
  carbsConsumed,
  carbsGoal,
  proteinConsumed,
  proteinGoal,
  fatConsumed,
  fatGoal,
  caloriesConsumed,
  caloriesGoal,
}: {
  carbsConsumed: number;
  carbsGoal: number;
  proteinConsumed: number;
  proteinGoal: number;
  fatConsumed: number;
  fatGoal: number;
  caloriesConsumed: number;
  caloriesGoal: number;
}) {
  const caloriesPct = caloriesGoal > 0 ? Math.min((caloriesConsumed / caloriesGoal) * 100, 100) : 0;

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="grid grid-cols-3 gap-3 sm:gap-5">
        <CompactStat
          label="Carbohidratos"
          shortLabel="Carbos"
          consumed={carbsConsumed}
          goal={carbsGoal}
          unit="g"
          colorVar="--color-carbs"
        />
        <CompactStat
          label="Proteínas"
          shortLabel="Prot."
          consumed={proteinConsumed}
          goal={proteinGoal}
          unit="g"
          colorVar="--color-protein"
        />
        <CompactStat
          label="Grasas"
          shortLabel="Grasas"
          consumed={fatConsumed}
          goal={fatGoal}
          unit="g"
          colorVar="--color-fat"
        />
      </div>

      <div className="mt-4 border-t border-border pt-3 sm:mt-5 sm:pt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] font-semibold tracking-wide text-calories sm:text-xs">
            Calorías
          </span>
          <p className="tabular-data text-[13px] font-semibold text-calories sm:text-sm">
            {Math.round(caloriesConsumed)} / {Math.round(caloriesGoal)}
            <span className="ml-0.5 text-[10px] font-medium sm:text-xs">kcal</span>
          </p>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${caloriesPct}%`, backgroundColor: "var(--color-calories)" }}
          />
        </div>
      </div>
    </div>
  );
}
