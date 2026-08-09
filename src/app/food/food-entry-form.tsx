"use client";

import { useEffect, useState, useTransition } from "react";
import { addFoodEntry, updateFoodEntry } from "@/app/food/actions";
import { FoodSearchInput } from "@/app/food/food-search-input";
import { BarcodeScannerModal } from "@/app/food/barcode-scanner-modal";
import type { MealType } from "@/lib/supabase/database.types";
import type { FoodProduct } from "@/lib/food-database/open-food-facts";

interface FoodEntryDefaults {
  entryId?: string;
  name?: string;
  quantity?: number;
  unit?: string;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
}

interface Macros {
  calories: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
}

const EMPTY_MACROS: Macros = { calories: "", proteinG: "", carbsG: "", fatG: "" };

function scaleFromProduct(product: FoodProduct, grams: number): Macros {
  const factor = grams / 100;
  return {
    calories: String(Math.round(product.caloriesPer100g * factor)),
    proteinG: String(Math.round(product.proteinPer100g * factor * 10) / 10),
    carbsG: String(Math.round(product.carbsPer100g * factor * 10) / 10),
    fatG: String(Math.round(product.fatPer100g * factor * 10) / 10),
  };
}

function defaultsToMacros(defaults?: FoodEntryDefaults): Macros {
  if (!defaults) return EMPTY_MACROS;
  return {
    calories: defaults.calories != null ? String(defaults.calories) : "",
    proteinG: defaults.proteinG != null ? String(defaults.proteinG) : "",
    carbsG: defaults.carbsG != null ? String(defaults.carbsG) : "",
    fatG: defaults.fatG != null ? String(defaults.fatG) : "",
  };
}

export function FoodEntryForm({
  mealType,
  mode,
  defaults,
  onDone,
}: {
  mealType: MealType;
  mode: "add" | "edit";
  defaults?: FoodEntryDefaults;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [showScanner, setShowScanner] = useState(false);

  const [product, setProduct] = useState<FoodProduct | null>(null);
  const [name, setName] = useState(defaults?.name ?? "");
  const [quantity, setQuantity] = useState(
    defaults?.quantity != null ? String(defaults.quantity) : ""
  );
  const [unit, setUnit] = useState(defaults?.unit ?? "g");
  const [macrosEditable, setMacrosEditable] = useState(false);
  const [macros, setMacros] = useState<Macros>(defaultsToMacros(defaults));

  const isAutoComputed = product !== null && !macrosEditable;

  // Recalcula los macros cada vez que cambia la cantidad, mientras
  // haya un producto elegido y el usuario no haya tomado el control
  // manual de los campos.
  useEffect(() => {
    if (!product || macrosEditable) return;
    const grams = parseFloat(quantity);
    if (!Number.isFinite(grams) || grams <= 0) return;
    setMacros(scaleFromProduct(product, grams));
  }, [product, quantity, macrosEditable]);

  function handleSelectProduct(p: FoodProduct) {
    setProduct(p);
    setName(p.name);
    setUnit("g");
    setMacrosEditable(false);
    if (!quantity || parseFloat(quantity) <= 0) {
      setQuantity("100");
    }
  }

  function handleRemoveProduct() {
    setProduct(null);
    setMacrosEditable(false);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const action = mode === "add" ? addFoodEntry : updateFoodEntry;
      if (mode === "add") {
        formData.set("mealType", mealType);
      }
      const result = await action(formData);
      if (result.success) {
        onDone();
      }
    });
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-3 rounded-xl border border-border bg-surface-elevated p-4"
    >
      {mode === "edit" && defaults?.entryId && (
        <input type="hidden" name="entryId" value={defaults.entryId} />
      )}

      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="min-w-0 flex-1">
            <FoodSearchInput onSelect={handleSelectProduct} disabled={isPending} />
          </div>
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            disabled={isPending}
            className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors hover:bg-surface disabled:opacity-50"
          >
            Escanear código
          </button>
        </div>

        {product && (
          <p className="text-xs text-muted">
            Usando <span className="font-medium text-foreground">{product.name}</span>
            {product.brand ? ` (${product.brand})` : ""} — valores por 100g.{" "}
            <button
              type="button"
              onClick={handleRemoveProduct}
              className="underline underline-offset-4 hover:text-foreground"
            >
              Quitar
            </button>
          </p>
        )}
      </div>

      <input
        name="name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre del alimento"
        className={inputClass}
      />

      <div className="flex gap-2">
        <input
          name="quantity"
          type="number"
          step="any"
          required
          min={0}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder={product ? "Gramos" : "Cantidad"}
          className={`${inputClass} min-w-0 flex-1`}
        />
        {product !== null ? (
          // Con un producto elegido la unidad siempre es "g" (los
          // macros de Open Food Facts vienen por 100g) — se muestra
          // fija y se manda igual vía input oculto, porque un
          // <select disabled> no viaja en el FormData al enviar.
          <div className={`${inputClass} min-w-0 flex-1 truncate bg-surface text-muted`}>
            Gramos (g)
            <input type="hidden" name="unit" value="g" />
          </div>
        ) : (
          <select
            name="unit"
            required
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className={`${inputClass} min-w-0 flex-1`}
          >
            <option value="g">Gramos (g)</option>
            <option value="ml">Mililitros (ml)</option>
            <option value="unidad">Unidad</option>
            {!["g", "ml", "unidad"].includes(unit) && (
              <option value={unit}>{unit || "Otra"}</option>
            )}
          </select>
        )}
      </div>

      <div className={isAutoComputed ? "rounded-lg border border-border bg-surface p-3" : ""}>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            name="calories"
            label="Calorías"
            value={macros.calories}
            readOnly={isAutoComputed}
            onChange={(v) => setMacros((m) => ({ ...m, calories: v }))}
          />
          <NumberField
            name="proteinG"
            label="Proteína (g)"
            value={macros.proteinG}
            readOnly={isAutoComputed}
            onChange={(v) => setMacros((m) => ({ ...m, proteinG: v }))}
          />
          <NumberField
            name="carbsG"
            label="Carbos (g)"
            value={macros.carbsG}
            readOnly={isAutoComputed}
            onChange={(v) => setMacros((m) => ({ ...m, carbsG: v }))}
          />
          <NumberField
            name="fatG"
            label="Grasas (g)"
            value={macros.fatG}
            readOnly={isAutoComputed}
            onChange={(v) => setMacros((m) => ({ ...m, fatG: v }))}
          />
        </div>
        {isAutoComputed && (
          <button
            type="button"
            onClick={() => setMacrosEditable(true)}
            className="mt-2 text-xs text-muted underline underline-offset-4 hover:text-foreground"
          >
            Editar macros manualmente
          </button>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onDone}
          className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity disabled:opacity-50"
        >
          {isPending ? "Guardando…" : mode === "add" ? "Agregar" : "Guardar cambios"}
        </button>
      </div>

      {showScanner && (
        <BarcodeScannerModal
          onDetected={(p) => {
            handleSelectProduct(p);
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </form>
  );
}

function NumberField({
  name,
  label,
  value,
  readOnly,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  readOnly?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      <input
        name={name}
        type="number"
        step="0.1"
        required
        min={0}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} ${readOnly ? "bg-surface-elevated text-muted" : ""} tabular-data`}
      />
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-foreground/40 focus:outline-none";
