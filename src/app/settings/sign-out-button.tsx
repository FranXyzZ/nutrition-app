"use client";

import { useTransition } from "react";
import { signOut } from "@/app/login/actions";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => signOut())}
      className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-elevated disabled:opacity-50"
    >
      {isPending ? "Cerrando sesión…" : "Cerrar sesión"}
    </button>
  );
}
