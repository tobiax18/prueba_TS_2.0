import { Role } from "@prisma/client";

import type { SessionUser } from "@/server/auth/jwt";
import { auditService } from "@/server/auditoria/audit.service";
import type { ScheduledReportRequestDTO } from "@/server/dtos/report.dto";
import { dashboardRepository } from "@/server/repositories/dashboard.repository";
import { reportRepository } from "@/server/repositories/report.repository";
import { pdfReportService } from "@/server/services/pdf-report.service";
import { AppError } from "@/server/utils/app-error";

async function buildExecutionSummary(
  payload: ScheduledReportRequestDTO,
  actor?: SessionUser,
) {
  switch (payload.plantilla) {
    case "transportes-activos": {
      const transportes = await dashboardRepository.transportesActivos();
      return {
        recordsCount: transportes.length,
        summary: {
          totalTransportesActivos: transportes.length,
        },
      };
    }
    case "reservas-por-fecha": {
      const generated = await pdfReportService.generate(
        {
          plantilla: payload.plantilla,
          fechaDesde: payload.fechaDesde,
          fechaHasta: payload.fechaHasta,
        },
        actor ?? {
          id: "system",
          fullName: "System Scheduler",
          email: "system@local",
          role: Role.ADMIN,
        },
      );

      return {
        recordsCount: generated.recordsCount,
        summary: generated.summary,
      };
    }
    case "reportes-por-usuario": {
      const usuarioId = payload.usuarioId ?? actor?.id;

      if (!usuarioId) {
        throw new AppError(
          "Debe indicar usuarioId para programar ese reporte",
          400,
        );
      }

      const reportes = await reportRepository.listByUser(usuarioId);
      return {
        recordsCount: reportes.length,
        summary: {
          usuarioId,
          totalReportes: reportes.length,
        },
      };
    }
    case "administrativo":
    default: {
      const [
        reportesActivos,
        usuariosRegistrados,
        transportesActivos,
        reservasTotales,
      ] = await Promise.all([
        dashboardRepository.countActiveReports(),
        dashboardRepository.countUsers(),
        dashboardRepository.countActiveTransports(),
        dashboardRepository.countReservationsInRange(),
      ]);

      return {
        recordsCount: 4,
        summary: {
          reportesActivos,
          usuariosRegistrados,
          transportesActivos,
          reservasTotales,
        },
      };
    }
  }
}

export const scheduledReportService = {
  async execute(
    payload: ScheduledReportRequestDTO,
    trigger: "manual" | "cron",
    actor?: SessionUser,
  ) {
    try {
      const execution = await buildExecutionSummary(payload, actor);
      const reportType = pdfReportService.mapTemplateToReportType(
        payload.plantilla,
      );
      const fileName =
        trigger === "manual"
          ? `${payload.plantilla}-${new Date().toISOString().slice(0, 10)}.${payload.formato}`
          : undefined;

      const run = await dashboardRepository.createScheduledRun({
        reportType,
        format: payload.formato,
        status: "SUCCESS",
        trigger,
        fileName,
        filters: payload,
        recordsCount: execution.recordsCount,
        summary: execution.summary,
      });

      await auditService.logAction({
        action: "REPORT_SCHEDULED_RUN",
        entity: "ScheduledReportRun",
        entityId: run.id,
        userId: actor?.id,
        metadata: {
          plantilla: payload.plantilla,
          trigger,
          formato: payload.formato,
        },
      });

      return run;
    } catch (error) {
      const reportType = pdfReportService.mapTemplateToReportType(
        payload.plantilla,
      );

      await dashboardRepository.createScheduledRun({
        reportType,
        format: payload.formato,
        status: "FAILED",
        trigger,
        filters: payload,
        summary: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });

      throw error;
    }
  },

  listRuns(limit = 10) {
    return dashboardRepository.listScheduledRuns(limit);
  },
};
