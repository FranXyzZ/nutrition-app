"use client";

import { useEffect, useRef, useState } from "react";
import { searchFoods } from "@/app/food/food-lookup-actions";
import type { FoodProduct } from "@/lib/food-database/open-food-facts";

export function FoodSearchInput({
  onSelect,
  disabled,
}: {
  onSelect: (product: FoodProduct) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const currentRequest = ++requestId.current;

    const timeout = setTimeout(async () => {
      const products = await searchFoods(trimmed);
      // Ignorar respuestas de búsquedas viejas que llegan tarde.
      if (currentRequest === requestId.current) {
        setResults(products);
        setIsLoading(false);
        setIsOpen(true);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        disabled={disabled}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        placeholder="Buscar alimento (ej: huevo, pechuga de pollo…)"
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-foreground/40 focus:outline-none disabled:opacity-50"
      />

      {isLoading && (
        <p className="mt-1.5 text-xs text-muted">Buscando…</p>
      )}

      {isOpen && !isLoading && results.length === 0 && query.trim().length >= 2 && (
        <p className="mt-1.5 text-xs text-muted">
          Sin resultados — podés cargarlo manualmente abajo.
        </p>
      )}

      {isOpen && results.length > 0 && (
        <ul className="absolute z-10 mt-1.5 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
          {results.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(product);
                  setQuery(product.name);
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-elevated"
              >
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <span className="h-9 w-9 shrink-0 rounded-md bg-surface-elevated" />
                )}
                <span className="min-w-0">
                  <span className="block truncate font-medium">{product.name}</span>
                  <span className="tabular-data block text-xs text-muted">
                    {product.brand ? `${product.brand} · ` : ""}
                    {product.caloriesPer100g} kcal /100g
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
