import type { Prisma } from "@prisma/client";

import type { ReportListQueryDTO } from "@/server/dtos/report.dto";
import { prisma } from "@/server/prisma/client";

const reportInclude = {
  usuario: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
    },
  },
} satisfies Prisma.ReportInclude;

export type ReportWithUser = Prisma.ReportGetPayload<{
  include: typeof reportInclude;
}>;

export const reportRepository = {
  create(data: Prisma.ReportUncheckedCreateInput) {
    return prisma.report.create({
      data,
      include: reportInclude,
    });
  },

  findById(id: string) {
    return prisma.report.findUnique({
      where: { id },
      include: reportInclude,
    });
  },

  update(id: string, data: Prisma.ReportUncheckedUpdateInput) {
    return prisma.report.update({
      where: { id },
      data,
      include: reportInclude,
    });
  },

  async list(query: ReportListQueryDTO, forcedUserId?: string) {
    const where: Prisma.ReportWhereInput = {
      deletedAt: null,
      ...(query.includeInactive ? {} : { isActive: true }),
    };

    const usuarioId = forcedUserId ?? query.usuarioId;

    if (usuarioId) {
      where.usuarioId = usuarioId;
    }

    if (query.tipo) {
      where.tipo = query.tipo;
    }

    if (query.fechaDesde || query.fechaHasta) {
      where.fecha = {};

      if (query.fechaDesde) {
        where.fecha.gte = new Date(query.fechaDesde);
      }

      if (query.fechaHasta) {
        where.fecha.lte = new Date(query.fechaHasta);
      }
    }

    if (query.q) {
      where.OR = [
        {
          descripcion: {
            contains: query.q,
            mode: "insensitive",
          },
        },
        {
          usuario: {
            fullName: {
              contains: query.q,
              mode: "insensitive",
            },
          },
        },
        {
          usuario: {
            email: {
              contains: query.q,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const skip = (query.page - 1) * query.limit;

    const [data, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: reportInclude,
        orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
        skip,
        take: query.limit,
      }),
      prisma.report.count({ where }),
    ]);

    return { data, total };
  },

  listByUser(usuarioId: string) {
    return prisma.report.findMany({
      where: {
        usuarioId,
        deletedAt: null,
        isActive: true,
      },
      include: reportInclude,
      orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
    });
  },
};
