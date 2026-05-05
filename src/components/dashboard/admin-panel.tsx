"use client";

import { useEffect, useState, useTransition } from "react";

import { apiAction, apiJson, ApiClientError } from "@/lib/api-client";
import { LoadingState } from "@/components/shared/loading-state";

interface ScheduledRun {
  id: string;
  reportType: string;
  status: string;
  trigger: string;
  generatedAt: string;
  fileName: string | null;
}

const scheduledTemplates = [
  { value: "administrativo", label: "Administrativo" },
  { value: "transportes-activos", label: "Transportes activos" },
  { value: "reservas-por-fecha", label: "Reservas por fecha" },
  { value: "reportes-por-usuario", label: "Reportes por usuario" },
];

export function AdminPanel() {
  const [runs, setRuns] = useState<ScheduledRun[]>([]);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState("administrativo");
  const [isPending, startTransition] = useTransition();

  async function loadRuns() {
    setLoading(true);

    try {
      const result = await apiJson<ScheduledRun[]>(
        "/api/v1/reportes/scheduled",
      );
      setRuns(result);
    } catch (requestError) {
      setFeedback(
        requestError instanceof ApiClientError
          ? requestError.message
          : "No fue posible cargar el historial programado.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const result = await apiJson<ScheduledRun[]>(
          "/api/v1/reportes/scheduled",
        );

        if (!cancelled) {
          setRuns(result);
        }
      } catch (requestError) {
        if (!cancelled) {
          setFeedback(
            requestError instanceof ApiClientError
              ? requestError.message
              : "No fue posible cargar el historial programado.",
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
  }, []);

  const triggerRun = () => {
    startTransition(async () => {
      try {
        setFeedback("");
        await apiAction("/api/v1/reportes/scheduled", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plantilla: template,
            formato: "pdf",
          }),
        });
        setFeedback("La ejecución manual quedó registrada correctamente.");
        await loadRuns();
      } catch (requestError) {
        setFeedback(
          requestError instanceof Error
            ? requestError.message
            : "No fue posible ejecutar la tarea programada.",
        );
      }
    });
  };

  if (loading) {
    return <LoadingState label="Cargando panel administrativo..." />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
      <section className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
        <p className="text-xs uppercase tracking-[0.22em] text-[#0f766e]">
          Cron jobs
        </p>
        <h3 className="mt-2 text-xl font-semibold text-slate-950">
          Generación automática
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Esta sección simula el disparo manual del cron para dejar evidencia
          funcional y auditable.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Plantilla a ejecutar
            </span>
            <select
              value={template}
              onChange={(event) => setTemplate(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            >
              {scheduledTemplates.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            disabled={isPending}
            onClick={triggerRun}
            className="w-full rounded-2xl bg-[#0f766e] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#115e59] disabled:opacity-60"
          >
            {isPending ? "Ejecutando..." : "Ejecutar cron manual"}
          </button>

          {feedback ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {feedback}
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
        <p className="text-xs uppercase tracking-[0.22em] text-[#b45309]">
          Trazabilidad
        </p>
        <h3 className="mt-2 text-xl font-semibold text-slate-950">
          Historial de ejecuciones
        </h3>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="pb-3 font-medium">Tipo</th>
                <th className="pb-3 font-medium">Estado</th>
                <th className="pb-3 font-medium">Trigger</th>
                <th className="pb-3 font-medium">Archivo</th>
                <th className="pb-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {runs.map((run) => (
                <tr key={run.id}>
                  <td className="py-3 text-slate-900">{run.reportType}</td>
                  <td className="py-3 text-slate-600">{run.status}</td>
                  <td className="py-3 text-slate-600">{run.trigger}</td>
                  <td className="py-3 text-slate-600">
                    {run.fileName ?? "N/A"}
                  </td>
                  <td className="py-3 text-slate-600">
                    {run.generatedAt.slice(0, 16).replace("T", " ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
