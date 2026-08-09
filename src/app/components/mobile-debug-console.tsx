"use client";

import { useEffect } from "react";

/**
 * Consola de debug visible en pantalla — sólo se activa en
 * `next dev` (NODE_ENV === "development"). Sirve para ver errores
 * de JS y las requests de red directo en el celular, sin cable ni
 * DevTools remoto. Toca el botón flotante que aparece abajo a la
 * derecha para abrirla.
 *
 * TEMPORAL: una vez que termines de debuggear, borrá este archivo
 * y su <MobileDebugConsole /> + import en layout.tsx — no debe ir
 * a producción.
 */
export function MobileDebugConsole() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/eruda";
    script.onload = () => {
      // @ts-expect-error -- eruda se inyecta como global via CDN
      window.eruda?.init();
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
}
