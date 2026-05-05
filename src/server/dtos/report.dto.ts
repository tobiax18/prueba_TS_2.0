import type { ReportType } from "@prisma/client";

export interface CreateReportDTO {
  tipo: ReportType;
  fecha: string;
  usuarioId: string;
  descripcion: string;
}

export interface UpdateReportDTO {
  tipo?: ReportType;
  fecha?: string;
  usuarioId?: string;
  descripcion?: string;
  isActive?: boolean;
}

export interface ReportListQueryDTO {
  page: number;
  limit: number;
  q?: string;
  tipo?: ReportType;
  usuarioId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  includeInactive?: boolean;
}

export type PdfTemplateType =
  | "transportes-activos"
  | "reservas-por-fecha"
  | "reportes-por-usuario"
  | "administrativo";

export interface PdfReportQueryDTO {
  plantilla: PdfTemplateType;
  usuarioId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface ScheduledReportRequestDTO extends PdfReportQueryDTO {
  formato: "pdf";
}
