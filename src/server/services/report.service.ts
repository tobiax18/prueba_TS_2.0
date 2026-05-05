import { Role } from "@prisma/client";

import type { SessionUser } from "@/server/auth/jwt";
import { auditService } from "@/server/auditoria/audit.service";
import type {
  CreateReportDTO,
  PdfReportQueryDTO,
  ReportListQueryDTO,
  ScheduledReportRequestDTO,
  UpdateReportDTO,
} from "@/server/dtos/report.dto";
import { dashboardRepository } from "@/server/repositories/dashboard.repository";
import { reportRepository } from "@/server/repositories/report.repository";
import { userRepository } from "@/server/repositories/user.repository";
import { pdfReportService } from "@/server/services/pdf-report.service";
import { scheduledReportService } from "@/server/services/scheduled-report.service";
import { paginationMeta } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/app-error";

function assertAdmin(session: SessionUser) {
  if (session.role !== Role.ADMIN) {
    throw new AppError("403 Forbidden", 403);
  }
}

function assertReportAccess(
  report: {
    id: string;
    usuarioId: string;
  },
  session: SessionUser,
) {
  if (session.role !== Role.ADMIN && report.usuarioId !== session.id) {
    throw new AppError("403 Forbidden", 403);
  }
}

export const reportService = {
  async createReport(payload: CreateReportDTO, session: SessionUser) {
    assertAdmin(session);

    const user = await userRepository.findById(payload.usuarioId);

    if (!user || !user.isActive) {
      throw new AppError("Usuario destino no encontrado o inactivo", 404);
    }

    const report = await reportRepository.create({
      tipo: payload.tipo,
      fecha: new Date(payload.fecha),
      usuarioId: payload.usuarioId,
      descripcion: payload.descripcion,
      isActive: true,
    });

    await auditService.logAction({
      action: "REPORT_CREATE",
      entity: "Report",
      entityId: report.id,
      userId: session.id,
      metadata: {
        tipo: payload.tipo,
        usuarioId: payload.usuarioId,
      },
    });

    return report;
  },

  async listReports(query: ReportListQueryDTO, session: SessionUser) {
    const scopedQuery = {
      ...query,
      includeInactive:
        session.role === Role.ADMIN ? query.includeInactive : false,
    };
    const forcedUserId = session.role === Role.ADMIN ? undefined : session.id;
    const { data, total } = await reportRepository.list(
      scopedQuery,
      forcedUserId,
    );

    return {
      items: data,
      pagination: paginationMeta(query.page, query.limit, total),
    };
  },

  async getReportById(id: string, session: SessionUser) {
    const report = await reportRepository.findById(id);

    if (!report || report.deletedAt) {
      throw new AppError("Reporte no encontrado", 404);
    }

    assertReportAccess(report, session);

    return report;
  },

  async updateReport(
    id: string,
    payload: UpdateReportDTO,
    session: SessionUser,
  ) {
    assertAdmin(session);

    const existingReport = await reportRepository.findById(id);

    if (!existingReport || existingReport.deletedAt) {
      throw new AppError("Reporte no encontrado", 404);
    }

    if (payload.usuarioId) {
      const user = await userRepository.findById(payload.usuarioId);

      if (!user || !user.isActive) {
        throw new AppError("Usuario destino no encontrado o inactivo", 404);
      }
    }

    const updatedReport = await reportRepository.update(id, {
      ...(payload.tipo ? { tipo: payload.tipo } : {}),
      ...(payload.fecha ? { fecha: new Date(payload.fecha) } : {}),
      ...(payload.usuarioId ? { usuarioId: payload.usuarioId } : {}),
      ...(payload.descripcion ? { descripcion: payload.descripcion } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
    });

    await auditService.logAction({
      action: "REPORT_UPDATE",
      entity: "Report",
      entityId: id,
      userId: session.id,
      metadata: {
        before: {
          tipo: existingReport.tipo,
          fecha: existingReport.fecha.toISOString(),
          usuarioId: existingReport.usuarioId,
          isActive: existingReport.isActive,
        },
        after: {
          tipo: updatedReport.tipo,
          fecha: updatedReport.fecha.toISOString(),
          usuarioId: updatedReport.usuarioId,
          isActive: updatedReport.isActive,
        },
      },
    });

    return updatedReport;
  },

  async deleteReport(id: string, session: SessionUser) {
    assertAdmin(session);

    const existingReport = await reportRepository.findById(id);

    if (!existingReport || existingReport.deletedAt) {
      throw new AppError("Reporte no encontrado", 404);
    }

    const deletedReport = await reportRepository.update(id, {
      isActive: false,
      deletedAt: new Date(),
    });

    await auditService.logAction({
      action: "REPORT_DELETE",
      entity: "Report",
      entityId: id,
      userId: session.id,
      metadata: {
        softDelete: true,
      },
    });

    return deletedReport;
  },

  async searchReports(query: ReportListQueryDTO, session: SessionUser) {
    return this.listReports(query, session);
  },

  async generatePdf(query: PdfReportQueryDTO, session: SessionUser) {
    return pdfReportService.generate(query, session);
  },

  async listScheduledRuns(session: SessionUser) {
    assertAdmin(session);
    return scheduledReportService.listRuns(10);
  },

  async executeScheduledRun(
    payload: ScheduledReportRequestDTO,
    session: SessionUser,
  ) {
    assertAdmin(session);
    return scheduledReportService.execute(payload, "manual", session);
  },

  async getAdministrativeSnapshot() {
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
      reportesActivos,
      usuariosRegistrados,
      transportesActivos,
      reservasTotales,
    };
  },
};
