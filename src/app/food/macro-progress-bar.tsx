export function MacroProgressBar({
  label,
  consumed,
  goal,
  unit,
  colorVar,
}: {
  label: string;
  consumed: number;
  goal: number;
  unit: string;
  colorVar: string;
}) {
  const pct = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;
  const remaining = Math.round(goal - consumed);

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-data text-xs text-muted">
          {Math.round(consumed)} / {Math.round(goal)} {unit}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: `var(${colorVar})` }}
        />
      </div>
      <p className="tabular-data text-xs text-muted">
        {remaining >= 0 ? `${remaining} ${unit} restantes` : `${Math.abs(remaining)} ${unit} por encima`}
      </p>
    </div>
  );
}
