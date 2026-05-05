import { ReportType } from "@prisma/client";

import { prisma } from "@/server/prisma/client";

export const dashboardRepository = {
  countActiveReports() {
    return prisma.report.count({
      where: {
        deletedAt: null,
        isActive: true,
      },
    });
  },

  countUsers() {
    return prisma.user.count();
  },

  countActiveTransports() {
    return prisma.transportUnit.count({
      where: {
        isActive: true,
        status: "ACTIVE",
      },
    });
  },

  countReservationsInRange(fechaDesde?: Date, fechaHasta?: Date) {
    return prisma.reservation.count({
      where: {
        ...(fechaDesde || fechaHasta
          ? {
              travelDate: {
                ...(fechaDesde ? { gte: fechaDesde } : {}),
                ...(fechaHasta ? { lte: fechaHasta } : {}),
              },
            }
          : {}),
      },
    });
  },

  reportesPorTipo() {
    return prisma.report.groupBy({
      by: ["tipo"],
      where: {
        deletedAt: null,
        isActive: true,
      },
      _count: {
        id: true,
      },
    });
  },

  reservasEnRango(fechaDesde: Date, fechaHasta: Date) {
    return prisma.reservation.findMany({
      where: {
        travelDate: {
          gte: fechaDesde,
          lte: fechaHasta,
        },
      },
      orderBy: {
        travelDate: "asc",
      },
      select: {
        id: true,
        code: true,
        travelDate: true,
        status: true,
        seats: true,
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
        transportUnit: {
          select: {
            code: true,
            plateNumber: true,
          },
        },
      },
    });
  },

  transportesActivos() {
    return prisma.transportUnit.findMany({
      where: {
        isActive: true,
        status: "ACTIVE",
      },
      orderBy: {
        code: "asc",
      },
    });
  },

  reportesRecientes(limit = 6) {
    return prisma.report.findMany({
      where: {
        deletedAt: null,
      },
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        usuario: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  },

  createScheduledRun(data: {
    reportType: ReportType;
    format: string;
    status: string;
    trigger: string;
    fileName?: string;
    filters?: object;
    recordsCount?: number;
    summary?: object;
  }) {
    return prisma.scheduledReportRun.create({
      data,
    });
  },

  listScheduledRuns(limit = 10) {
    return prisma.scheduledReportRun.findMany({
      take: limit,
      orderBy: {
        generatedAt: "desc",
      },
    });
  },
};
