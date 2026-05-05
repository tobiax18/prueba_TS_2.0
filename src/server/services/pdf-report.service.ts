import { ReportType } from "@prisma/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type { PdfReportQueryDTO } from "@/server/dtos/report.dto";
import { dashboardRepository } from "@/server/repositories/dashboard.repository";
import { reportRepository } from "@/server/repositories/report.repository";
import { userRepository } from "@/server/repositories/user.repository";
import { endOfDay, startOfDay } from "@/server/utils/date";
import type { SessionUser } from "@/server/auth/jwt";
import { AppError } from "@/server/utils/app-error";

const templateToReportType: Record<PdfReportQueryDTO["plantilla"], ReportType> =
  {
    "transportes-activos": ReportType.TRANSPORTES_ACTIVOS,
    "reservas-por-fecha": ReportType.RESERVAS_POR_FECHA,
    "reportes-por-usuario": ReportType.REPORTES_POR_USUARIO,
    administrativo: ReportType.ADMINISTRATIVO,
  };

function buildDateRange(query: PdfReportQueryDTO) {
  const end = query.fechaHasta
    ? endOfDay(new Date(query.fechaHasta))
    : endOfDay(new Date());
  const start = query.fechaDesde
    ? startOfDay(new Date(query.fechaDesde))
    : startOfDay(new Date(end));
  start.setDate(start.getDate() - 29);

  return { start, end };
}

function createPdfBuffer(params: {
  title: string;
  subtitle: string;
  headers: string[];
  rows: Array<Array<string | number>>;
  summaryLines: string[];
}) {
  const document = new jsPDF({
    unit: "pt",
    format: "a4",
  });

  document.setFontSize(20);
  document.text(params.title, 40, 48);
  document.setFontSize(11);
  document.text(params.subtitle, 40, 72);

  autoTable(document, {
    startY: 96,
    head: [params.headers],
    body: params.rows,
    styles: {
      fontSize: 9,
      cellPadding: 6,
    },
    headStyles: {
      fillColor: [14, 116, 144],
    },
  });

  const tableAwareDocument = document as jsPDF & {
    lastAutoTable?: {
      finalY: number;
    };
  };
  const summaryY = (tableAwareDocument.lastAutoTable?.finalY ?? 96) + 28;

  document.setFontSize(11);
  params.summaryLines.forEach((line, index) => {
    document.text(line, 40, summaryY + index * 18);
  });

  return Buffer.from(document.output("arraybuffer"));
}

export const pdfReportService = {
  async generate(query: PdfReportQueryDTO, session: SessionUser) {
    const reportType = templateToReportType[query.plantilla];

    if (query.plantilla === "transportes-activos") {
      const transportes = await dashboardRepository.transportesActivos();

      return {
        reportType,
        fileName: `transportes-activos-${new Date().toISOString().slice(0, 10)}.pdf`,
        recordsCount: transportes.length,
        summary: {
          totalTransportes: transportes.length,
        },
        buffer: createPdfBuffer({
          title: "Reporte de Transportes Activos",
          subtitle: "Listado operativo de unidades activas",
          headers: ["Codigo", "Placa", "Estado", "Capacidad"],
          rows: transportes.map((item) => [
            item.code,
            item.plateNumber,
            item.status,
            item.capacity,
          ]),
          summaryLines: [
            `Total de transportes activos: ${transportes.length}`,
            `Generado por: ${session.fullName}`,
          ],
        }),
      };
    }

    if (query.plantilla === "reservas-por-fecha") {
      const { start, end } = buildDateRange(query);
      const reservas = await dashboardRepository.reservasEnRango(start, end);

      return {
        reportType,
        fileName: `reservas-${start.toISOString().slice(0, 10)}-${end.toISOString().slice(0, 10)}.pdf`,
        recordsCount: reservas.length,
        summary: {
          fechaDesde: start.toISOString(),
          fechaHasta: end.toISOString(),
          totalReservas: reservas.length,
        },
        buffer: createPdfBuffer({
          title: "Reporte de Reservas por Fecha",
          subtitle: `Desde ${start.toISOString().slice(0, 10)} hasta ${end.toISOString().slice(0, 10)}`,
          headers: [
            "Codigo",
            "Fecha",
            "Usuario",
            "Unidad",
            "Estado",
            "Asientos",
          ],
          rows: reservas.map((item) => [
            item.code,
            item.travelDate.toISOString().slice(0, 10),
            item.user.fullName,
            item.transportUnit.code,
            item.status,
            item.seats,
          ]),
          summaryLines: [
            `Total de reservas en el periodo: ${reservas.length}`,
            `Generado por: ${session.fullName}`,
          ],
        }),
      };
    }

    if (query.plantilla === "reportes-por-usuario") {
      const usuarioId = query.usuarioId ?? session.id;

      if (session.role !== "ADMIN" && usuarioId !== session.id) {
        throw new AppError("403 Forbidden", 403);
      }

      const [usuario, reportes] = await Promise.all([
        userRepository.findById(usuarioId),
        reportRepository.listByUser(usuarioId),
      ]);

      if (!usuario) {
        throw new AppError("Usuario no encontrado", 404);
      }

      return {
        reportType,
        fileName: `reportes-usuario-${usuario.fullName.toLowerCase().replace(/\s+/g, "-")}.pdf`,
        recordsCount: reportes.length,
        summary: {
          usuarioId,
          totalReportes: reportes.length,
        },
        buffer: createPdfBuffer({
          title: "Reporte Filtrado por Usuario",
          subtitle: `${usuario.fullName} <${usuario.email}>`,
          headers: ["Tipo", "Fecha", "Estado", "Descripcion"],
          rows: reportes.map((item) => [
            item.tipo,
            item.fecha.toISOString().slice(0, 10),
            item.isActive ? "Activo" : "Inactivo",
            item.descripcion,
          ]),
          summaryLines: [
            `Total de reportes del usuario: ${reportes.length}`,
            `Generado por: ${session.fullName}`,
          ],
        }),
      };
    }

    const metrics = await Promise.all([
      dashboardRepository.countActiveReports(),
      dashboardRepository.countUsers(),
      dashboardRepository.countActiveTransports(),
      dashboardRepository.countReservationsInRange(),
    ]);

    const [
      reportesActivos,
      usuariosRegistrados,
      transportesActivos,
      reservasTotales,
    ] = metrics;

    return {
      reportType,
      fileName: `reporte-administrativo-${new Date().toISOString().slice(0, 10)}.pdf`,
      recordsCount: 4,
      summary: {
        reportesActivos,
        usuariosRegistrados,
        transportesActivos,
        reservasTotales,
      },
      buffer: createPdfBuffer({
        title: "Reporte Administrativo",
        subtitle: "Resumen ejecutivo de operacion del modulo",
        headers: ["Indicador", "Valor"],
        rows: [
          ["Reportes activos", reportesActivos],
          ["Usuarios registrados", usuariosRegistrados],
          ["Transportes activos", transportesActivos],
          ["Reservas totales", reservasTotales],
        ],
        summaryLines: [
          `Generado por: ${session.fullName}`,
          `Fecha de generacion: ${new Date().toISOString()}`,
        ],
      }),
    };
  },

  mapTemplateToReportType(plantilla: PdfReportQueryDTO["plantilla"]) {
    return templateToReportType[plantilla];
  },
};
