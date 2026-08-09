"use client";

import { useEffect, useRef, useState } from "react";
import type { IScannerControls } from "@zxing/browser";
import { lookupBarcode } from "@/app/food/food-lookup-actions";
import type { FoodProduct } from "@/lib/food-database/open-food-facts";

export function BarcodeScannerModal({
  onDetected,
  onClose,
}: {
  onDetected: (product: FoodProduct) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [status, setStatus] = useState<"scanning" | "looking-up" | "not-found" | "error">(
    "scanning"
  );

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();

        const controls = await reader.decodeFromVideoDevice(
          undefined, // cámara por defecto (trasera en celular, si el navegador la expone)
          videoRef.current ?? undefined,
          (result) => {
            if (!result || cancelled) return;
            void handleDetected(result.getText());
          }
        );

        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
      } catch (err) {
        console.error("No se pudo acceder a la cámara:", err);
        if (!cancelled) setStatus("error");
      }
    }

    async function handleDetected(code: string) {
      controlsRef.current?.stop();
      setStatus("looking-up");
      const product = await lookupBarcode(code);
      if (cancelled) return;
      if (product) {
        onDetected(product);
      } else {
        setStatus("not-found");
      }
    }

    start();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Escanear código de barras</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted underline underline-offset-4 hover:text-foreground"
          >
            Cerrar
          </button>
        </div>

        <div className="relative aspect-square overflow-hidden rounded-xl bg-black">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          {status === "scanning" && (
            <div className="pointer-events-none absolute inset-8 rounded-lg border-2 border-white/70" />
          )}
        </div>

        <div className="mt-3 min-h-5 text-center text-xs text-muted">
          {status === "scanning" && "Apuntá al código de barras del producto."}
          {status === "looking-up" && "Código detectado, buscando el producto…"}
          {status === "not-found" && (
            <>
              No encontramos ese producto en la base de datos.{" "}
              <button
                type="button"
                onClick={() => setStatus("scanning")}
                className="underline underline-offset-4 hover:text-foreground"
              >
                Probar de nuevo
              </button>{" "}
              o cerrá y cargalo manualmente.
            </>
          )}
          {status === "error" &&
            "No pudimos acceder a la cámara. Revisá los permisos del navegador."}
        </div>
      </div>
    </div>
  );
}
