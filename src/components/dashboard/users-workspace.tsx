"use client";

import { useEffect, useState } from "react";

import { apiJson, ApiClientError } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/loading-state";

interface UsersPayload {
  items: Array<{
    id: string;
    fullName: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function UsersWorkspace() {
  const [payload, setPayload] = useState<UsersPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const result = await apiJson<UsersPayload>(
          "/api/v1/users?page=1&limit=12",
        );
        setPayload(result);
      } catch (requestError) {
        setError(
          requestError instanceof ApiClientError
            ? requestError.message
            : "No fue posible cargar el listado de usuarios.",
        );
      }
    })();
  }, []);

  if (!payload && !error) {
    return <LoadingState label="Cargando usuarios..." />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
      <p className="text-xs uppercase tracking-[0.22em] text-[#0f766e]">
        Administración
      </p>
      <h3 className="mt-2 text-xl font-semibold text-slate-950">
        Usuarios registrados
      </h3>
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="pb-3 font-medium">Nombre</th>
              <th className="pb-3 font-medium">Correo</th>
              <th className="pb-3 font-medium">Rol</th>
              <th className="pb-3 font-medium">Estado</th>
              <th className="pb-3 font-medium">Alta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payload?.items.map((user) => (
              <tr key={user.id}>
                <td className="py-3 text-slate-900">{user.fullName}</td>
                <td className="py-3 text-slate-600">{user.email}</td>
                <td className="py-3 text-slate-600">{user.role}</td>
                <td className="py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      user.isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {user.isActive ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="py-3 text-slate-600">
                  {user.createdAt.slice(0, 10)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
