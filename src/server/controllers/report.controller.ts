import type { NextRequest } from "next/server";

import { requireAuthSession } from "@/server/middlewares/auth.middleware";
import { reportService } from "@/server/services/report.service";
import { successResponse } from "@/server/utils/api-response";
import { errorToResponse } from "@/server/utils/error-handler";
import {
  validateCreateReportPayload,
  validatePdfQuery,
  validateReportListQuery,
  validateScheduledReportPayload,
  validateUpdateReportPayload,
} from "@/server/validators/report.validator";

export const reportController = {
  async create(request: NextRequest) {
    try {
      const session = await requireAuthSession(request);
      const payload = validateCreateReportPayload(await request.json());
      const report = await reportService.createReport(payload, session);

      return Response.json(
        successResponse(report, "Reporte creado correctamente"),
        {
          status: 201,
        },
      );
    } catch (error) {
      return errorToResponse(error);
    }
  },

  async list(request: NextRequest) {
    try {
      const session = await requireAuthSession(request);
      const query = validateReportListQuery(new URL(request.url).searchParams);
      const result = await reportService.listReports(query, session);

      return Response.json(successResponse(result, "Reportes cargados"));
    } catch (error) {
      return errorToResponse(error);
    }
  },

  async getById(request: NextRequest, id: string) {
    try {
      const session = await requireAuthSession(request);
      const report = await reportService.getReportById(id, session);

      return Response.json(successResponse(report, "Reporte cargado"));
    } catch (error) {
      return errorToResponse(error);
    }
  },

  async update(request: NextRequest, id: string) {
    try {
      const session = await requireAuthSession(request);
      const payload = validateUpdateReportPayload(await request.json());
      const report = await reportService.updateReport(id, payload, session);

      return Response.json(
        successResponse(report, "Reporte actualizado correctamente"),
      );
    } catch (error) {
      return errorToResponse(error);
    }
  },

  async remove(request: NextRequest, id: string) {
    try {
      const session = await requireAuthSession(request);
      const report = await reportService.deleteReport(id, session);

      return Response.json(
        successResponse(report, "Reporte eliminado correctamente"),
      );
    } catch (error) {
      return errorToResponse(error);
    }
  },

  async search(request: NextRequest) {
    try {
      const session = await requireAuthSession(request);
      const query = validateReportListQuery(new URL(request.url).searchParams);
      const result = await reportService.searchReports(query, session);

      return Response.json(successResponse(result, "Búsqueda completada"));
    } catch (error) {
      return errorToResponse(error);
    }
  },

  async downloadPdf(request: NextRequest) {
    try {
      const session = await requireAuthSession(request);
      const query = validatePdfQuery(new URL(request.url).searchParams);
      const pdfResult = await reportService.generatePdf(query, session);

      return new Response(pdfResult.buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${pdfResult.fileName}"`,
        },
      });
    } catch (error) {
      return errorToResponse(error);
    }
  },

  async listScheduledRuns(request: NextRequest) {
    try {
      const session = await requireAuthSession(request);
      const runs = await reportService.listScheduledRuns(session);

      return Response.json(
        successResponse(runs, "Historial de ejecuciones cargado"),
      );
    } catch (error) {
      return errorToResponse(error);
    }
  },

  async executeScheduledRun(request: NextRequest) {
    try {
      const session = await requireAuthSession(request);
      const payload = validateScheduledReportPayload(await request.json());
      const run = await reportService.executeScheduledRun(payload, session);

      return Response.json(
        successResponse(run, "Ejecución programada registrada"),
        {
          status: 201,
        },
      );
    } catch (error) {
      return errorToResponse(error);
    }
  },
};
