"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProfileAndCalculateMacros, saveCustomGoals } from "@/app/onboarding/actions";

type Step = "form" | "review";

const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Sedentario", hint: "Poco o nada de ejercicio" },
  { value: "light", label: "Ligero", hint: "Ejercicio 1–3 días/semana" },
  { value: "moderate", label: "Moderado", hint: "Ejercicio 3–5 días/semana" },
  { value: "active", label: "Activo", hint: "Ejercicio 6–7 días/semana" },
  { value: "very_active", label: "Muy activo", hint: "Ejercicio intenso + trabajo físico" },
] as const;

const GOAL_OPTIONS = [
  { value: "lose_fat", label: "Perder grasa" },
  { value: "maintain", label: "Mantener peso" },
  { value: "gain_muscle", label: "Ganar masa" },
] as const;

interface Macros {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface InitialProfile {
  age?: number | null;
  sex?: "male" | "female" | null;
  weightKg?: number | null;
  heightCm?: number | null;
  activityLevel?: "sedentary" | "light" | "moderate" | "active" | "very_active" | null;
  goal?: "lose_fat" | "maintain" | "gain_muscle" | null;
}

export function ProfileForm({ initialProfile }: { initialProfile?: InitialProfile }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [macros, setMacros] = useState<Macros | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function handleSubmitProfile(formData: FormData) {
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await saveProfileAndCalculateMacros(formData);
      if (!result.success) {
        setError(result.error ?? "Ocurrió un error.");
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      if (result.macros) {
        setMacros(result.macros);
        setStep("review");
      }
    });
  }

  function handleSubmitCustomGoals(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await saveCustomGoals(formData);
      if (!result.success) {
        setError(result.error ?? "Ocurrió un error.");
        return;
      }
      router.push("/dashboard");
    });
  }

  if (step === "review" && macros) {
    return (
      <MacroReview
        macros={macros}
        error={error}
        isPending={isPending}
        onSubmit={handleSubmitCustomGoals}
        onBack={() => setStep("form")}
      />
    );
  }

  return (
    <form action={handleSubmitProfile} className="space-y-8">
      {error && (
        <p className="rounded-lg border border-negative/30 bg-negative/10 px-4 py-3 text-sm text-negative">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Edad" error={fieldErrors.age}>
          <input
            name="age"
            type="number"
            required
            min={13}
            max={100}
            placeholder="30"
            defaultValue={initialProfile?.age ?? undefined}
            className={inputClass}
          />
        </Field>

        <Field label="Sexo" error={fieldErrors.sex}>
          <select
            name="sex"
            required
            defaultValue={initialProfile?.sex ?? ""}
            className={inputClass}
          >
            <option value="" disabled>
              Elegir
            </option>
            <option value="male">Masculino</option>
            <option value="female">Femenino</option>
          </select>
        </Field>

        <Field label="Peso (kg)" error={fieldErrors.weightKg}>
          <input
            name="weightKg"
            type="number"
            step="0.1"
            required
            min={30}
            max={300}
            placeholder="75"
            defaultValue={initialProfile?.weightKg ?? undefined}
            className={inputClass}
          />
        </Field>

        <Field label="Altura (cm)" error={fieldErrors.heightCm}>
          <input
            name="heightCm"
            type="number"
            required
            min={100}
            max={250}
            placeholder="175"
            defaultValue={initialProfile?.heightCm ?? undefined}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Nivel de actividad" error={fieldErrors.activityLevel}>
        <div className="space-y-2">
          {ACTIVITY_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors has-checked:border-foreground/40 has-checked:bg-surface-elevated"
            >
              <input
                type="radio"
                name="activityLevel"
                value={opt.value}
                required
                defaultChecked={initialProfile?.activityLevel === opt.value}
                className="mt-1 accent-foreground"
              />
              <span>
                <span className="block text-sm font-medium">{opt.label}</span>
                <span className="block text-xs text-muted">{opt.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </Field>

      <Field label="Objetivo" error={fieldErrors.goal}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {GOAL_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center justify-center rounded-xl border border-border bg-surface px-3 py-3 text-center text-sm font-medium transition-colors has-checked:border-foreground/40 has-checked:bg-surface-elevated"
            >
              <input
                type="radio"
                name="goal"
                value={opt.value}
                required
                defaultChecked={initialProfile?.goal === opt.value}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </Field>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-foreground px-6 py-3.5 text-sm font-medium text-background transition-opacity disabled:opacity-50"
      >
        {isPending
          ? "Calculando…"
          : initialProfile
            ? "Recalcular mis macros"
            : "Calcular mis macros"}
      </button>
    </form>
  );
}

function MacroReview({
  macros,
  error,
  isPending,
  onSubmit,
  onBack,
}: {
  macros: Macros;
  error: string | null;
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted">
          Estos son tus objetivos diarios calculados. Podés ajustarlos manualmente antes de
          continuar.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-negative/30 bg-negative/10 px-4 py-3 text-sm text-negative">
          {error}
        </p>
      )}

      <form action={onSubmit} className="space-y-6">
        <MacroInput name="calories" label="Calorías" unit="kcal" defaultValue={macros.calories} colorVar="--color-calories" />
        <MacroInput name="proteinG" label="Proteína" unit="g" defaultValue={macros.proteinG} colorVar="--color-protein" />
        <MacroInput name="carbsG" label="Carbohidratos" unit="g" defaultValue={macros.carbsG} colorVar="--color-carbs" />
        <MacroInput name="fatG" label="Grasas" unit="g" defaultValue={macros.fatG} colorVar="--color-fat" />

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="min-w-0 flex-1 rounded-xl border border-border px-4 py-3.5 text-sm font-medium transition-colors hover:bg-surface-elevated sm:px-6"
          >
            Volver
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="min-w-0 flex-1 rounded-xl bg-foreground px-4 py-3.5 text-sm font-medium text-background transition-opacity disabled:opacity-50 sm:px-6"
          >
            {isPending ? "Guardando…" : "Confirmar y continuar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function MacroInput({
  name,
  label,
  unit,
  defaultValue,
  colorVar,
}: {
  name: string;
  label: string;
  unit: string;
  defaultValue: number;
  colorVar: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: `var(${colorVar})` }}
        />
        <label htmlFor={name} className="truncate text-sm font-medium">
          {label}
        </label>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <input
          id={name}
          name={name}
          type="number"
          defaultValue={defaultValue}
          className="tabular-data w-20 rounded-lg border border-border bg-background px-2.5 py-1.5 text-right text-sm focus:border-foreground/40 focus:outline-none sm:w-24 sm:px-3"
        />
        <span className="text-xs text-muted">{unit}</span>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-negative">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:border-foreground/40 focus:outline-none";
