"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { apiJson, ApiClientError } from "@/lib/api-client";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";

interface MetricsPayload {
  cards: {
    reportesActivos: number;
    usuariosRegistrados: number;
    transportesActivos: number;
    reservasDelPeriodo: number;
    actividadSistema: number;
  };
  reportesPorTipo: Array<{
    tipo: string;
    total: number;
  }>;
  reservasPorFecha: Array<{
    fecha: string;
    total: number;
  }>;
  actividadReciente: Array<{
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    createdAt: string;
    user: {
      id: string;
      fullName: string;
      email: string;
    } | null;
  }>;
  reportesRecientes: Array<{
    id: string;
    tipo: string;
    fecha: string;
    descripcion: string;
    createdAt: string;
    usuario: {
      id: string;
      fullName: string;
      email: string;
    };
  }>;
  scheduledRuns: Array<{
    id: string;
    reportType: string;
    status: string;
    trigger: string;
    generatedAt: string;
    fileName: string | null;
  }>;
}

const labels: Record<string, string> = {
  TRANSPORTES_ACTIVOS: "Transportes activos",
  RESERVAS_POR_FECHA: "Reservas por fecha",
  REPORTES_POR_USUARIO: "Por usuario",
  ADMINISTRATIVO: "Administrativo",
};

export function DashboardOverview() {
  const [metrics, setMetrics] = useState<MetricsPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const result = await apiJson<MetricsPayload>(
          "/api/v1/dashboard/metrics",
        );

        if (!cancelled) {
          setMetrics(result);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof ApiClientError
              ? requestError.message
              : "No fue posible cargar las métricas del dashboard.",
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

  if (loading) {
    return <LoadingState label="Construyendo dashboard ejecutivo..." />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  if (!metrics) {
    return (
      <EmptyState
        title="No hay datos disponibles"
        description="El sistema aún no devolvió métricas para el dashboard."
      />
    );
  }

  const cards = [
    {
      label: "Reportes activos",
      value: metrics.cards.reportesActivos,
      accent: "from-[#0f766e] to-[#14b8a6]",
    },
    {
      label: "Usuarios registrados",
      value: metrics.cards.usuariosRegistrados,
      accent: "from-[#b45309] to-[#f59e0b]",
    },
    {
      label: "Transportes activos",
      value: metrics.cards.transportesActivos,
      accent: "from-[#1d4ed8] to-[#60a5fa]",
    },
    {
      label: "Reservas del periodo",
      value: metrics.cards.reservasDelPeriodo,
      accent: "from-[#7c2d12] to-[#f97316]",
    },
    {
      label: "Actividad del sistema",
      value: metrics.cards.actividadSistema,
      accent: "from-[#334155] to-[#64748b]",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <article
            key={card.label}
            className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-sm backdrop-blur"
          >
            <div className={`h-2 bg-gradient-to-r ${card.accent}`} />
            <div className="p-5">
              <p className="text-sm text-slate-600">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {card.value}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[#0f766e]">
              Tendencia
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">
              Reservas por fecha
            </h3>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.reservasPorFecha}>
                <defs>
                  <linearGradient
                    id="reservationFill"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#dbe4df" strokeDasharray="3 3" />
                <XAxis dataKey="fecha" stroke="#475569" fontSize={12} />
                <YAxis stroke="#475569" allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#0f766e"
                  strokeWidth={2}
                  fill="url(#reservationFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.22em] text-[#b45309]">
              Distribución
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">
              Reportes por tipo
            </h3>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.reportesPorTipo}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis
                  dataKey="tipo"
                  stroke="#475569"
                  tickFormatter={(value) => labels[value] ?? value}
                  fontSize={12}
                />
                <YAxis stroke="#475569" allowDecimals={false} fontSize={12} />
                <Tooltip
                  formatter={(value) => [value, "Total"]}
                  labelFormatter={(value) => labels[value] ?? value}
                />
                <Bar dataKey="total" radius={[12, 12, 0, 0]} fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.22em] text-[#1d4ed8]">
              Operación reciente
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">
              Últimos reportes
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-3 font-medium">Tipo</th>
                  <th className="pb-3 font-medium">Usuario</th>
                  <th className="pb-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.reportesRecientes.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 text-slate-800">
                      {labels[item.tipo] ?? item.tipo}
                    </td>
                    <td className="py-3 text-slate-600">
                      {item.usuario.fullName}
                    </td>
                    <td className="py-3 text-slate-600">
                      {item.fecha.slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.22em] text-[#7c2d12]">
              Auditoría
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">
              Actividad del sistema
            </h3>
          </div>
          <div className="space-y-3">
            {metrics.actividadReciente.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {item.action}
                  </p>
                  <span className="text-xs text-slate-500">
                    {item.createdAt.slice(0, 16).replace("T", " ")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {item.entity}{" "}
                  {item.entityId ? `#${item.entityId.slice(0, 8)}` : ""}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.user
                    ? `${item.user.fullName} · ${item.user.email}`
                    : "Sistema"}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
