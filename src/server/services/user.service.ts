import { Role } from "@prisma/client";

import type { UserListQueryDTO } from "@/server/dtos/user.dto";
import { userRepository } from "@/server/repositories/user.repository";
import type { SessionUser } from "@/server/auth/jwt";
import { paginationMeta } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/app-error";

function assertAdmin(session: SessionUser) {
  if (session.role !== Role.ADMIN) {
    throw new AppError("403 Forbidden", 403);
  }
}

export const userService = {
  async listUsers(query: UserListQueryDTO, session: SessionUser) {
    assertAdmin(session);

    const { data, total } = await userRepository.list(query);

    return {
      items: data,
      pagination: paginationMeta(query.page, query.limit, total),
    };
  },

  async getSelectableUsers(session: SessionUser) {
    assertAdmin(session);
    return userRepository.listForSelect();
  },
};
