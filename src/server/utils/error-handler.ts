import { logger } from "@/server/logs/logger";
import { errorResponse } from "@/server/utils/api-response";
import { AppError, isAppError } from "@/server/utils/app-error";

export function asAppError(
  error: unknown,
  fallbackMessage = "Error interno del servidor",
) {
  if (isAppError(error)) {
    return error;
  }

  logger.error("Unhandled application error", error);

  return new AppError(fallbackMessage, 500);
}

export function errorToResponse(error: unknown, fallbackMessage?: string) {
  const appError = asAppError(error, fallbackMessage);

  return Response.json(errorResponse(appError.message, appError.statusCode), {
    status: appError.statusCode,
  });
}
