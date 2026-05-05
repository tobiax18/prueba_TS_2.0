import type { ReportType } from "@prisma/client";

export interface DashboardMetricsDTO {
  cards: {
    reportesActivos: number;
    usuariosRegistrados: number;
    transportesActivos: number;
    reservasDelPeriodo: number;
    actividadSistema: number;
  };
  reportesPorTipo: Array<{
    tipo: ReportType;
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
    tipo: ReportType;
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
    reportType: ReportType;
    status: string;
    trigger: string;
    generatedAt: string;
    fileName: string | null;
  }>;
}
