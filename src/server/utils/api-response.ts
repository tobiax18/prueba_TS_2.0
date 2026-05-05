export function successResponse<T>(data: T, message = "Operación exitosa") {
  return {
    success: true,
    data,
    message,
  };
}

export function errorResponse(error: string, statusCode: number) {
  return {
    success: false,
    error,
    statusCode,
  };
}

export function paginationMeta(page: number, limit: number, total: number) {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: totalPages > page,
    hasPreviousPage: page > 1,
  };
}
