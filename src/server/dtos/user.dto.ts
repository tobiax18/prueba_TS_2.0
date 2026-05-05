import type { Role } from "@prisma/client";

export interface UserListQueryDTO {
  page: number;
  limit: number;
  q?: string;
  role?: Role;
}
