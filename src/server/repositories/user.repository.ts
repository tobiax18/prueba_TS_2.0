import type { Prisma } from "@prisma/client";

import type { UserListQueryDTO } from "@/server/dtos/user.dto";
import { prisma } from "@/server/prisma/client";

const userListSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export const userRepository = {
  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: userListSelect,
    });
  },

  listForSelect() {
    return prisma.user.findMany({
      where: { isActive: true },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
      },
    });
  },

  async list(query: UserListQueryDTO) {
    const where: Prisma.UserWhereInput = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.q) {
      where.OR = [
        {
          fullName: {
            contains: query.q,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: query.q,
            mode: "insensitive",
          },
        },
      ];
    }

    const skip = (query.page - 1) * query.limit;

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
        select: userListSelect,
      }),
      prisma.user.count({ where }),
    ]);

    return { data, total };
  },
};
