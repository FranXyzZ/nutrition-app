export function MacroRing({
  label,
  consumed,
  goal,
  unit,
  colorVar,
  size = 88,
  strokeWidth = 7,
  glow = false,
}: {
  label: string;
  consumed: number;
  goal: number;
  unit: string;
  colorVar: string;
  size?: number;
  strokeWidth?: number;
  /** Resplandor neón real en el arco — reservado para el anillo
   *  protagonista (calorías), no para todos los anillos. */
  glow?: boolean;
}) {
  const pct = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);
  const remaining = Math.round(goal - consumed);

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`var(${colorVar})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={glow ? "glow-accent" : undefined}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="tabular-data text-lg leading-none font-semibold">
            {Math.round(consumed)}
          </span>
          <span className="tabular-data text-[10px] text-muted">/ {Math.round(goal)}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-medium">{label}</p>
        <p className="tabular-data text-[11px] text-muted">
          {remaining >= 0
            ? `${remaining} ${unit} restantes`
            : `${Math.abs(remaining)} ${unit} de más`}
        </p>
      </div>
    </div>
  );
}
