import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/prisma/client";

export const auditRepository = {
  create(data: Prisma.AuditLogUncheckedCreateInput) {
    return prisma.auditLog.create({ data });
  },

  listRecent(limit = 8) {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  },

  countLastDays(days: number) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return prisma.auditLog.count({
      where: {
        createdAt: {
          gte: since,
        },
      },
    });
  },
};
