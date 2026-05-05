import { ReportType } from "@prisma/client";

import type { DashboardMetricsDTO } from "@/server/dtos/dashboard.dto";
import { auditRepository } from "@/server/repositories/audit.repository";
import { dashboardRepository } from "@/server/repositories/dashboard.repository";
import { endOfDay, formatDateLabel, startOfDay } from "@/server/utils/date";

export const dashboardService = {
  async getMetrics(): Promise<DashboardMetricsDTO> {
    const today = new Date();
    const rangeEnd = endOfDay(today);
    const rangeStart = startOfDay(new Date(today));
    rangeStart.setDate(rangeStart.getDate() - 6);

    const [
      reportesActivos,
      usuariosRegistrados,
      transportesActivos,
      reservasDelPeriodo,
      actividadSistema,
      groupedByType,
      reservas,
      actividadReciente,
      reportesRecientes,
      scheduledRuns,
    ] = await Promise.all([
      dashboardRepository.countActiveReports(),
      dashboardRepository.countUsers(),
      dashboardRepository.countActiveTransports(),
      dashboardRepository.countReservationsInRange(rangeStart, rangeEnd),
      auditRepository.countLastDays(7),
      dashboardRepository.reportesPorTipo(),
      dashboardRepository.reservasEnRango(rangeStart, rangeEnd),
      auditRepository.listRecent(8),
      dashboardRepository.reportesRecientes(6),
      dashboardRepository.listScheduledRuns(8),
    ]);

    const reportesPorTipo = Object.values(ReportType).map((tipo) => {
      const match = groupedByType.find((entry) => entry.tipo === tipo);

      return {
        tipo,
        total: match?._count.id ?? 0,
      };
    });

    const reservationBuckets = reservas.reduce<Record<string, number>>(
      (accumulator, reservation) => {
        const key = formatDateLabel(reservation.travelDate);
        accumulator[key] = (accumulator[key] ?? 0) + 1;
        return accumulator;
      },
      {},
    );

    const reservasPorFecha = Object.entries(reservationBuckets).map(
      ([fecha, total]) => ({
        fecha,
        total,
      }),
    );

    return {
      cards: {
        reportesActivos,
        usuariosRegistrados,
        transportesActivos,
        reservasDelPeriodo,
        actividadSistema,
      },
      reportesPorTipo,
      reservasPorFecha,
      actividadReciente: actividadReciente.map((item) => ({
        id: item.id,
        action: item.action,
        entity: item.entity,
        entityId: item.entityId ?? null,
        createdAt: item.createdAt.toISOString(),
        user: item.user
          ? {
              id: item.user.id,
              fullName: item.user.fullName,
              email: item.user.email,
            }
          : null,
      })),
      reportesRecientes: reportesRecientes.map((item) => ({
        id: item.id,
        tipo: item.tipo,
        fecha: item.fecha.toISOString(),
        descripcion: item.descripcion,
        createdAt: item.createdAt.toISOString(),
        usuario: {
          id: item.usuario.id,
          fullName: item.usuario.fullName,
          email: item.usuario.email,
        },
      })),
      scheduledRuns: scheduledRuns.map((item) => ({
        id: item.id,
        reportType: item.reportType,
        status: item.status,
        trigger: item.trigger,
        generatedAt: item.generatedAt.toISOString(),
        fileName: item.fileName,
      })),
    };
  },
};
