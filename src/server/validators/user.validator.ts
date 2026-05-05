import { Role } from "@prisma/client";

import type { UserListQueryDTO } from "@/server/dtos/user.dto";
import { AppError } from "@/server/utils/app-error";

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new AppError(
      "Los parámetros de paginación deben ser enteros positivos",
      400,
    );
  }

  return parsedValue;
}

export function validateUserListQuery(
  searchParams: URLSearchParams,
): UserListQueryDTO {
  const role = searchParams.get("role");
  const q = searchParams.get("q")?.trim() || undefined;

  if (role && !Object.values(Role).includes(role as Role)) {
    throw new AppError("El filtro role es inválido", 400);
  }

  return {
    page: parsePositiveInt(searchParams.get("page"), 1),
    limit: Math.min(parsePositiveInt(searchParams.get("limit"), 10), 50),
    q,
    role: role ? (role as Role) : undefined,
  };
}
