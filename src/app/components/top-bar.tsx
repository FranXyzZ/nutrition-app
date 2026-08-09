"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

const SECTION_META: { prefix: string; eyebrow: string; title: string }[] = [
  { prefix: "/dashboard", eyebrow: "Hoy", title: "Dashboard" },
  { prefix: "/food", eyebrow: "Hoy", title: "Registro de comidas" },
  { prefix: "/calendar", eyebrow: "Progreso", title: "Calendario" },
  { prefix: "/settings", eyebrow: "Configuración", title: "Tu perfil y objetivos" },
];

function formatDates(date: Date) {
  const long = new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  const short = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);

  return { long, short };
}

export function TopBar() {
  const pathname = usePathname();

  const section = SECTION_META.find((s) => pathname?.startsWith(s.prefix));

  if (!section) {
    return null;
  }

  const { long, short } = formatDates(new Date());

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface">
      <div className="mx-auto max-w-lg px-4 sm:max-w-2xl sm:px-6">
        <div className="flex items-center justify-between py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <Image
              src="/logo.png"
              alt="Logo"
              width={20}
              height={20}
              className="shrink-0 rounded-md object-contain"
            />
            <span className="truncate text-xs font-medium text-muted">Nutrition App</span>
          </div>

          <p className="tabular-data shrink-0 text-xs text-muted capitalize">
            <span className="hidden sm:inline">{long}</span>
            <span className="sm:hidden">{short}</span>
          </p>
        </div>

        <div className="border-t border-border py-3">
          <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
            {section.eyebrow}
          </p>
          <h1 className="mt-0.5 truncate text-xl font-semibold sm:text-2xl">{section.title}</h1>
        </div>
      </div>
    </header>
  );
}
