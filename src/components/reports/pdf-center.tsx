"use client";

import { useEffect, useState, useTransition } from "react";

import { apiJson, downloadFile, ApiClientError } from "@/lib/api-client";

interface SessionInfo {
  id: string;
  role: "ADMIN" | "USER";
}

interface UserOption {
  id: string;
  fullName: string;
  email: string;
}

const templateCards = [
  {
    value: "transportes-activos",
    title: "Transportes activos",
    description: "Listado operativo de unidades disponibles y activas.",
  },
  {
    value: "reservas-por-fecha",
    title: "Reservas por fecha",
    description: "Exportación filtrada por rango para análisis comercial.",
  },
  {
    value: "reportes-por-usuario",
    title: "Reportes por usuario",
    description: "Historial de reportería asociado a un usuario específico.",
  },
  {
    value: "administrativo",
    title: "Administrativo",
    description: "Resumen ejecutivo con métricas de alto nivel.",
  },
] as const;

export function PdfCenter({ session }: { session: SessionInfo }) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [template, setTemplate] = useState<
    (typeof templateCards)[number]["value"]
  >("transportes-activos");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [userId, setUserId] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (session.role !== "ADMIN") {
      return;
    }

    void (async () => {
      try {
        const result = await apiJson<UserOption[]>("/api/v1/users?mode=select");
        setUsers(result);
        setUserId(result[0]?.id ?? "");
      } catch {
        setFeedback(
          "No fue posible cargar usuarios para exportación avanzada.",
        );
      }
    })();
  }, [session.role]);

  const handleDownload = () => {
    startTransition(async () => {
      try {
        setFeedback("");
        const searchParams = new URLSearchParams({
          plantilla: template,
        });

        if (template === "reservas-por-fecha") {
          searchParams.set("fechaDesde", startDate);
          searchParams.set("fechaHasta", endDate);
        }

        if (template === "reportes-por-usuario") {
          if (session.role === "ADMIN" && userId) {
            searchParams.set("usuarioId", userId);
          }
        }

        const { blob, fileName } = await downloadFile(
          `/api/v1/reportes/pdf?${searchParams.toString()}`,
        );
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        setFeedback("PDF generado y descargado correctamente.");
      } catch (requestError) {
        setFeedback(
          requestError instanceof ApiClientError
            ? requestError.message
            : "No fue posible generar el PDF.",
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-4">
        {templateCards.map((card) => (
          <button
            key={card.value}
            type="button"
            onClick={() => setTemplate(card.value)}
            className={`rounded-3xl border p-5 text-left transition ${
              template === card.value
                ? "border-[#0f766e] bg-[#0f766e] text-white shadow-lg shadow-[#0f766e]/20"
                : "border-white/70 bg-white/80 text-slate-900 shadow-sm"
            }`}
          >
            <h3 className="text-lg font-semibold">{card.title}</h3>
            <p
              className={`mt-2 text-sm ${template === card.value ? "text-white/80" : "text-slate-600"}`}
            >
              {card.description}
            </p>
          </button>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
          <p className="text-xs uppercase tracking-[0.22em] text-[#0f766e]">
            Configuración
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">
            Parámetros de exportación
          </h3>

          <div className="mt-6 space-y-4">
            {template === "reservas-por-fecha" ? (
              <>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Fecha desde
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Fecha hasta
                  </span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  />
                </label>
              </>
            ) : null}

            {template === "reportes-por-usuario" && session.role === "ADMIN" ? (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Usuario
                </span>
                <select
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <button
              type="button"
              disabled={isPending}
              onClick={handleDownload}
              className="w-full rounded-2xl bg-[#0f766e] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#115e59] disabled:opacity-60"
            >
              {isPending ? "Generando PDF..." : "Descargar PDF"}
            </button>

            {feedback ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {feedback}
              </div>
            ) : null}
          </div>
        </article>

        <article className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur">
          <p className="text-xs uppercase tracking-[0.22em] text-[#b45309]">
            Flujo de descarga
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">
            Exportación profesional
          </h3>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {templateCards.map((card) => (
              <div
                key={card.value}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {card.title}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
