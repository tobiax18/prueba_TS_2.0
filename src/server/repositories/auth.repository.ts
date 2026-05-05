import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/prisma/client";

const authUserSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  isActive: true,
  passwordHash: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const publicUserSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type AuthUserRecord = Prisma.UserGetPayload<{
  select: typeof authUserSelect;
}>;
export type PublicUserRecord = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

export const authRepository = {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: authUserSelect,
    });
  },

  findPublicUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });
  },

  createUser(data: Prisma.UserUncheckedCreateInput) {
    return prisma.user.create({
      data,
      select: publicUserSelect,
    });
  },

  saveRefreshToken(data: Prisma.RefreshTokenUncheckedCreateInput) {
    return prisma.refreshToken.create({ data });
  },

  findRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: publicUserSelect,
        },
      },
    });
  },

  revokeRefreshTokenById(id: string) {
    return prisma.refreshToken.update({
      where: { id },
      data: {
        revokedAt: new Date(),
      },
    });
  },

  revokeRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  },
};
