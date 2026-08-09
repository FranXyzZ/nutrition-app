"use client";

import { useState, useTransition } from "react";
import { signIn, signUp } from "@/app/login/actions";

type Mode = "signin" | "signup";

export function AuthForm({ checkEmail }: { checkEmail: boolean }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const action = mode === "signin" ? signIn : signUp;
      const result = await action(formData);
      // Si hubo éxito, la propia action hace el redirect y
      // este código ni se llega a ejecutar.
      if (!result.success) {
        setError(result.error ?? "Ocurrió un error.");
      }
    });
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="mb-1 text-2xl font-semibold">
        {mode === "signin" ? "Iniciar sesión" : "Crear cuenta"}
      </h1>
      <p className="mb-8 text-sm text-muted">
        {mode === "signin"
          ? "Ingresá con tu email y contraseña."
          : "Creá tu cuenta para empezar a trackear tus macros."}
      </p>

      {checkEmail && (
        <p className="mb-6 rounded-lg border border-border bg-surface-elevated px-4 py-3 text-sm">
          Te enviamos un email de confirmación. Confirmá tu cuenta y después iniciá sesión.
        </p>
      )}

      {error && (
        <p className="mb-6 rounded-lg border border-negative/30 bg-negative/10 px-4 py-3 text-sm text-negative">
          {error}
        </p>
      )}

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="vos@email.com"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:border-foreground/40 focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder="••••••••"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm focus:border-foreground/40 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-foreground px-6 py-3.5 text-sm font-medium text-background transition-opacity disabled:opacity-50"
        >
          {isPending
            ? "Un momento…"
            : mode === "signin"
              ? "Iniciar sesión"
              : "Crear cuenta"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setError(null);
          setMode(mode === "signin" ? "signup" : "signin");
        }}
        className="mt-6 text-sm text-muted underline underline-offset-4 hover:text-foreground"
      >
        {mode === "signin" ? "¿No tenés cuenta? Registrate" : "¿Ya tenés cuenta? Iniciá sesión"}
      </button>
    </div>
  );
}
