"use client";

import { useEffect, useState, useTransition } from "react";

import { apiAction, apiJson, ApiClientError } from "@/lib/api-client";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";

interface SessionInfo {
  id: string;
  fullName: string;
  email: string;
  role: "ADMIN" | "USER";
}

interface UserOption {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

interface ReportItem {
  id: string;
  tipo: string;
  fecha: string;
  descripcion: string;
  isActive: boolean;
  usuarioId: string;
  usuario: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

interface ReportsPayload {
  items: ReportItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

const reportTypeOptions = [
  { value: "TRANSPORTES_ACTIVOS", label: "Transportes activos" },
  { value: "RESERVAS_POR_FECHA", label: "Reservas por fecha" },
  { value: "REPORTES_POR_USUARIO", label: "Reportes por usuario" },
  { value: "ADMINISTRATIVO", label: "Administrativo" },
];

const emptyForm = {
  tipo: "TRANSPORTES_ACTIVOS",
  fecha: new Date().toISOString().slice(0, 10),
  usuarioId: "",
  descripcion: "",
  isActive: true,
};

export function ReportsWorkspace({ session }: { session: SessionInfo }) {
  const [reports, setReports] = useState<ReportsPayload | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [tipo, setTipo] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  async function loadReports(pageToLoad = page) {
    setError("");

    try {
      const searchParams = new URLSearchParams({
        page: String(pageToLoad),
        limit: "8",
      });

      if (query.trim()) {
        searchParams.set("q", query.trim());
      }

      if (tipo) {
        searchParams.set("tipo", tipo);
      }

      const endpoint = query.trim()
        ? `/api/v1/reportes/search?${searchParams.toString()}`
        : `/api/v1/reportes?${searchParams.toString()}`;

      const [reportData, userData] = await Promise.all([
        apiJson<ReportsPayload>(endpoint),
        session.role === "ADMIN"
          ? apiJson<UserOption[]>("/api/v1/users?mode=select")
          : Promise.resolve<UserOption[]>([]),
      ]);

      setReports(reportData);
      setUsers(userData);

      if (session.role === "ADMIN" && !form.usuarioId && userData[0]) {
        setForm((current) => ({
          ...current,
          usuarioId: current.usuarioId || userData[0].id,
        }));
      }
    } catch (requestError) {
      setError(
        requestError instanceof ApiClientError
          ? requestError.message
          : "No fue posible cargar los reportes.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const searchParams = new URLSearchParams({
          page: String(page),
          limit: "8",
        });

        if (query.trim()) {
          searchParams.set("q", query.trim());
        }

        if (tipo) {
          searchParams.set("tipo", tipo);
        }

        const endpoint = query.trim()
          ? `/api/v1/reportes/search?${searchParams.toString()}`
          : `/api/v1/reportes?${searchParams.toString()}`;

        const [reportData, userData] = await Promise.all([
          apiJson<ReportsPayload>(endpoint),
          session.role === "ADMIN"
            ? apiJson<UserOption[]>("/api/v1/users?mode=select")
            : Promise.resolve<UserOption[]>([]),
        ]);

        if (!cancelled) {
          setReports(reportData);
          setUsers(userData);

          if (session.role === "ADMIN" && !form.usuarioId && userData[0]) {
            setForm((current) => ({
              ...current,
              usuarioId: current.usuarioId || userData[0].id,
            }));
          }
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof ApiClientError
              ? requestError.message
              : "No fue posible cargar los reportes.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page, query, tipo, session.role, form.usuarioId]);

  useEffect(() => {
    if (!selectedId || session.role !== "ADMIN") {
      return;
    }

    void (async () => {
      try {
        const report = await apiJson<ReportItem>(
          `/api/v1/reportes/${selectedId}`,
        );
        setForm({
          tipo: report.tipo,
          fecha: report.fecha.slice(0, 10),
          usuarioId: report.usuarioId,
          descripcion: report.descripcion,
          isActive: report.isActive,
        });
      } catch {
        setFeedback("No fue posible cargar el detalle del reporte.");
      }
    })();
  }, [selectedId, session.role]);

  const submitForm = () => {
    startTransition(async () => {
      try {
        setFeedback("");

        const endpoint = selectedId
          ? `/api/v1/reportes/${selectedId}`
          : "/api/v1/reportes";
        const method = selectedId ? "PUT" : "POST";

        await apiAction(endpoint, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });

        setFeedback(
          selectedId
            ? "Reporte actualizado correctamente."
            : "Reporte creado correctamente.",
        );
        setSelectedId(null);
        setForm({
          ...emptyForm,
          usuarioId: users[0]?.id ?? "",
        });
        await loadReports(1);
        setPage(1);
      } catch (requestError) {
        setFeedback(
          requestError instanceof Error
            ? requestError.message
            : "No fue posible guardar el reporte.",
        );
      }
    });
  };

  const deleteReport = (id: string) => {
    startTransition(async () => {
      try {
        setFeedback("");
        await apiAction(`/api/v1/reportes/${id}`, {
          method: "DELETE",
        });
        setSelectedId(null);
        setForm({
          ...emptyForm,
          usuarioId: users[0]?.id ?? "",
        });
        setFeedback("Reporte eliminado con soft delete.");
        await loadReports(page);
      } catch (requestError) {
        setFeedback(
          requestError instanceof Error
            ? requestError.message
            : "No fue posible eliminar el reporte.",
        );
      }
    });
  };

  if (loading && !reports) {
    return <LoadingState label="Cargando módulo de reportes..." />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
      <section className="space-y-6">
        <article className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#0f766e]">
                Gestión
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">
                CRUD completo de reportes
              </h3>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por descripción o usuario"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0f766e]"
              />
              <select
                value={tipo}
                onChange={(event) => setTipo(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0f766e]"
              >
                <option value="">Todos los tipos</option>
                {reportTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setPage(1);
                }}
                className="rounded-2xl bg-[#0f766e] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#115e59]"
              >
                Aplicar filtros
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 overflow-x-auto">
            {reports?.items.length ? (
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="pb-3 font-medium">Tipo</th>
                    <th className="pb-3 font-medium">Fecha</th>
                    <th className="pb-3 font-medium">Usuario</th>
                    <th className="pb-3 font-medium">Estado</th>
                    <th className="pb-3 font-medium">Descripción</th>
                    {session.role === "ADMIN" ? (
                      <th className="pb-3 font-medium">Acciones</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.items.map((report) => (
                    <tr key={report.id}>
                      <td className="py-4 text-slate-900">
                        {reportTypeOptions.find(
                          (option) => option.value === report.tipo,
                        )?.label ?? report.tipo}
                      </td>
                      <td className="py-4 text-slate-600">
                        {report.fecha.slice(0, 10)}
                      </td>
                      <td className="py-4 text-slate-600">
                        {report.usuario.fullName}
                      </td>
                      <td className="py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            report.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {report.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="py-4 text-slate-600">
                        {report.descripcion}
                      </td>
                      {session.role === "ADMIN" ? (
                        <td className="py-4">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedId(report.id)}
                              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#0f766e] hover:text-[#0f766e]"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteReport(report.id)}
                              className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState
                title="Sin reportes para mostrar"
                description="Ajusta los filtros o crea un nuevo reporte desde el panel lateral."
              />
            )}
          </div>

          {reports ? (
            <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span>
                Página {reports.pagination.page} de{" "}
                {Math.max(reports.pagination.totalPages, 1)}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!reports.pagination.hasPreviousPage}
                  onClick={() => {
                    setLoading(true);
                    setPage((current) => Math.max(current - 1, 1));
                  }}
                  className="rounded-xl border border-slate-200 px-3 py-2 font-semibold disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={!reports.pagination.hasNextPage}
                  onClick={() => {
                    setLoading(true);
                    setPage((current) => current + 1);
                  }}
                  className="rounded-xl border border-slate-200 px-3 py-2 font-semibold disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          ) : null}
        </article>
      </section>

      <aside className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
        <p className="text-xs uppercase tracking-[0.22em] text-[#b45309]">
          Operación
        </p>
        <h3 className="mt-2 text-xl font-semibold text-slate-950">
          {selectedId ? "Editar reporte" : "Nuevo reporte"}
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Solo el rol ADMIN puede crear, modificar o eliminar información
          crítica.
        </p>

        {session.role !== "ADMIN" ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Tu perfil puede consultar reportes propios y descargar PDFs, pero no
            gestionar altas ni cambios.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Tipo</span>
              <select
                value={form.tipo}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    tipo: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#b45309]"
              >
                {reportTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Fecha</span>
              <input
                type="date"
                value={form.fecha}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fecha: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#b45309]"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Usuario
              </span>
              <select
                value={form.usuarioId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    usuarioId: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#b45309]"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} · {user.role}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Descripción
              </span>
              <textarea
                value={form.descripcion}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    descripcion: event.target.value,
                  }))
                }
                rows={6}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#b45309]"
                placeholder="Describe el objetivo, alcance y contexto del reporte."
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
                className="h-4 w-4"
              />
              <span className="text-sm text-slate-700">
                Mantener el reporte activo
              </span>
            </label>

            {feedback ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {feedback}
              </div>
            ) : null}

            <div className="flex gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={submitForm}
                className="flex-1 rounded-2xl bg-[#b45309] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#92400e] disabled:opacity-60"
              >
                {isPending
                  ? "Guardando..."
                  : selectedId
                    ? "Actualizar"
                    : "Crear"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(null);
                  setFeedback("");
                  setForm({
                    ...emptyForm,
                    usuarioId: users[0]?.id ?? "",
                  });
                }}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                Limpiar
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
