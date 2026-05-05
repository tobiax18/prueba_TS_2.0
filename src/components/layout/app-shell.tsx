"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { logoutRequest } from "@/lib/api-client";

interface AppShellProps {
  children: React.ReactNode;
  session: {
    id: string;
    fullName: string;
    email: string;
    role: "ADMIN" | "USER";
  };
}

const navigation = [
  { href: "/dashboard", label: "Dashboard", roles: ["ADMIN", "USER"] },
  { href: "/reportes", label: "Reportes", roles: ["ADMIN", "USER"] },
  { href: "/pdf", label: "Centro PDF", roles: ["ADMIN", "USER"] },
  {
    href: "/panel-administrativo",
    label: "Panel Administrativo",
    roles: ["ADMIN"],
  },
  { href: "/usuarios", label: "Usuarios", roles: ["ADMIN"] },
] satisfies Array<{
  href: string;
  label: string;
  roles: Array<"ADMIN" | "USER">;
}>;

export function AppShell({ children, session }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const visibleLinks = navigation.filter((item) =>
    item.roles.includes(session.role),
  );

  const handleLogout = () => {
    startTransition(async () => {
      try {
        setError("");
        await logoutRequest();
        router.replace("/login");
      } catch {
        setError("No fue posible cerrar la sesión en este momento.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.14),_transparent_35%),linear-gradient(180deg,_#f5f7f3_0%,_#eef2ea_100%)]">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-white/60 bg-[#0f172a] px-6 py-8 text-slate-100 xl:border-b-0 xl:border-r xl:border-r-white/10">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.24em] text-[#7dd3c7]">
              Reportería empresarial
            </p>
            <h1 className="mt-3 text-2xl font-semibold leading-tight text-white">
              Enterprise Reports Hub
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Reportes, métricas, auditoría y exportación PDF en una sola
              consola.
            </p>
          </div>

          <nav className="space-y-2">
            {visibleLinks.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-[#14b8a6] text-slate-950 shadow-lg shadow-[#14b8a6]/20"
                      : "bg-white/5 text-slate-200 hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Sesión actual
            </p>
            <p className="mt-2 text-base font-semibold text-white">
              {session.fullName}
            </p>
            <p className="text-sm text-slate-300">{session.email}</p>
            <p className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#7dd3c7]">
              {session.role}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isPending}
            className="mt-6 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Cerrando sesión..." : "Cerrar sesión"}
          </button>

          {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="border-b border-slate-200/60 bg-white/80 px-6 py-5 backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#0f766e]">
                  Arquitectura por capas
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Panel profesional de reportes
                </h2>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Access token corto + refresh token rotativo + auditoría
                persistente
              </div>
            </div>
          </header>

          <main className="flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
