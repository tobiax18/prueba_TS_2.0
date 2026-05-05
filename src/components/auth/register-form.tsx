"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ApiClientError } from "@/lib/api-client";

export function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleSubmit = (formData: FormData) => {
    const payload = {
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    startTransition(async () => {
      try {
        setError("");

        const response = await fetch("/api/v1/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const body = await response.json();

        if (!response.ok || body.success === false) {
          throw new ApiClientError(
            body.error ?? "No fue posible crear la cuenta",
            response.status,
          );
        }

        router.replace("/dashboard");
        router.refresh();
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "No fue posible registrar el usuario en este momento.",
        );
      }
    });
  };

  return (
    <form
      action={handleSubmit}
      className="space-y-5 rounded-[28px] border border-white/70 bg-white/85 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-[#c2410c]">
          Registro
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Crea tu cuenta
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          El registro público crea usuarios estándar. El rol administrador se
          entrega por seed.
        </p>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">
          Nombre completo
        </span>
        <input
          type="text"
          name="fullName"
          required
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#c2410c]"
          placeholder="Nombre y apellido"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">
          Correo electrónico
        </span>
        <input
          type="email"
          name="email"
          required
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#c2410c]"
          placeholder="usuario@empresa.com"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Contraseña</span>
        <input
          type="password"
          name="password"
          required
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#c2410c]"
          placeholder="Mínimo 8 caracteres con reglas seguras"
        />
      </label>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-[#c2410c] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#9a3412] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      <p className="text-sm text-slate-600">
        ¿Ya tienes acceso?{" "}
        <Link href="/login" className="font-semibold text-[#c2410c]">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
