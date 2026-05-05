import { ReportType } from "@prisma/client";

import type {
  CreateReportDTO,
  PdfTemplateType,
  PdfReportQueryDTO,
  ReportListQueryDTO,
  ScheduledReportRequestDTO,
  UpdateReportDTO,
} from "@/server/dtos/report.dto";
import { AppError } from "@/server/utils/app-error";

const pdfTemplates = new Set([
  "transportes-activos",
  "reservas-por-fecha",
  "reportes-por-usuario",
  "administrativo",
]);

function isPdfTemplate(value: string): value is PdfTemplateType {
  return pdfTemplates.has(value);
}

function asObject(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new AppError("El cuerpo de la petición es inválido", 400);
  }

  return payload as Record<string, unknown>;
}

function getOptionalString(payload: Record<string, unknown>, field: string) {
  const value = payload[field];

  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new AppError(`El campo ${field} debe ser de tipo texto`, 400);
  }

  return value.trim();
}

function getRequiredString(payload: Record<string, unknown>, field: string) {
  const value = getOptionalString(payload, field);

  if (!value) {
    throw new AppError(`El campo ${field} es obligatorio`, 400);
  }

  return value;
}

function validateUuid(value: string, fieldName: string) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(value)) {
    throw new AppError(`El campo ${fieldName} debe ser un UUID válido`, 400);
  }

  return value;
}

function validateReportType(value: string) {
  if (!Object.values(ReportType).includes(value as ReportType)) {
    throw new AppError("El tipo de reporte es inválido", 400);
  }

  return value as ReportType;
}

function validateDescription(value: string) {
  if (value.length < 20 || value.length > 500) {
    throw new AppError(
      "La descripción debe tener entre 20 y 500 caracteres",
      400,
    );
  }

  return value;
}

function validateDateString(value: string, fieldName: string) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError(`El campo ${fieldName} debe ser una fecha válida`, 400);
  }

  const now = new Date();
  const oldestAllowed = new Date();
  oldestAllowed.setFullYear(now.getFullYear() - 5);

  if (parsedDate > now) {
    throw new AppError("La fecha del reporte no puede estar en el futuro", 400);
  }

  if (parsedDate < oldestAllowed) {
    throw new AppError(
      "La fecha del reporte está fuera del rango permitido",
      400,
    );
  }

  return value;
}

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

export function validateCreateReportPayload(payload: unknown): CreateReportDTO {
  const parsedPayload = asObject(payload);

  return {
    tipo: validateReportType(getRequiredString(parsedPayload, "tipo")),
    fecha: validateDateString(
      getRequiredString(parsedPayload, "fecha"),
      "fecha",
    ),
    usuarioId: validateUuid(
      getRequiredString(parsedPayload, "usuarioId"),
      "usuarioId",
    ),
    descripcion: validateDescription(
      getRequiredString(parsedPayload, "descripcion"),
    ),
  };
}

export function validateUpdateReportPayload(payload: unknown): UpdateReportDTO {
  const parsedPayload = asObject(payload);
  const dto: UpdateReportDTO = {};

  const tipo = getOptionalString(parsedPayload, "tipo");
  const fecha = getOptionalString(parsedPayload, "fecha");
  const usuarioId = getOptionalString(parsedPayload, "usuarioId");
  const descripcion = getOptionalString(parsedPayload, "descripcion");
  const isActive = parsedPayload.isActive;

  if (tipo) {
    dto.tipo = validateReportType(tipo);
  }

  if (fecha) {
    dto.fecha = validateDateString(fecha, "fecha");
  }

  if (usuarioId) {
    dto.usuarioId = validateUuid(usuarioId, "usuarioId");
  }

  if (descripcion) {
    dto.descripcion = validateDescription(descripcion);
  }

  if (isActive !== undefined) {
    if (typeof isActive !== "boolean") {
      throw new AppError("El campo isActive debe ser booleano", 400);
    }

    dto.isActive = isActive;
  }

  if (Object.keys(dto).length === 0) {
    throw new AppError("Debe enviar al menos un campo para actualizar", 400);
  }

  return dto;
}

export function validateReportListQuery(
  searchParams: URLSearchParams,
): ReportListQueryDTO {
  const tipo = searchParams.get("tipo");
  const usuarioId = searchParams.get("usuarioId");
  const fechaDesde = searchParams.get("fechaDesde");
  const fechaHasta = searchParams.get("fechaHasta");
  const q = searchParams.get("q")?.trim() || undefined;
  const includeInactive = searchParams.get("includeInactive");

  if (q && (q.length < 2 || q.length > 120)) {
    throw new AppError("La búsqueda debe tener entre 2 y 120 caracteres", 400);
  }

  return {
    page: parsePositiveInt(searchParams.get("page"), 1),
    limit: Math.min(parsePositiveInt(searchParams.get("limit"), 10), 50),
    q,
    tipo: tipo ? validateReportType(tipo) : undefined,
    usuarioId: usuarioId ? validateUuid(usuarioId, "usuarioId") : undefined,
    fechaDesde: fechaDesde
      ? validateDateString(fechaDesde, "fechaDesde")
      : undefined,
    fechaHasta: fechaHasta
      ? validateDateString(fechaHasta, "fechaHasta")
      : undefined,
    includeInactive: includeInactive === "true",
  };
}

export function validatePdfQuery(
  searchParams: URLSearchParams,
): PdfReportQueryDTO {
  const plantilla = searchParams.get("plantilla");
  const usuarioId = searchParams.get("usuarioId");
  const fechaDesde = searchParams.get("fechaDesde");
  const fechaHasta = searchParams.get("fechaHasta");

  if (!plantilla || !isPdfTemplate(plantilla)) {
    throw new AppError("La plantilla de PDF es inválida", 400);
  }

  return {
    plantilla,
    usuarioId: usuarioId ? validateUuid(usuarioId, "usuarioId") : undefined,
    fechaDesde: fechaDesde
      ? validateDateString(fechaDesde, "fechaDesde")
      : undefined,
    fechaHasta: fechaHasta
      ? validateDateString(fechaHasta, "fechaHasta")
      : undefined,
  };
}

export function validateScheduledReportPayload(
  payload: unknown,
): ScheduledReportRequestDTO {
  const parsedPayload = asObject(payload);
  const plantilla = getRequiredString(parsedPayload, "plantilla");
  const formato = getRequiredString(parsedPayload, "formato");
  const usuarioId = getOptionalString(parsedPayload, "usuarioId");
  const fechaDesde = getOptionalString(parsedPayload, "fechaDesde");
  const fechaHasta = getOptionalString(parsedPayload, "fechaHasta");

  if (!isPdfTemplate(plantilla)) {
    throw new AppError("La plantilla programada es inválida", 400);
  }

  if (formato !== "pdf") {
    throw new AppError("Solo se soporta formato PDF", 400);
  }

  return {
    plantilla,
    formato: "pdf",
    usuarioId: usuarioId ? validateUuid(usuarioId, "usuarioId") : undefined,
    fechaDesde: fechaDesde
      ? validateDateString(fechaDesde, "fechaDesde")
      : undefined,
    fechaHasta: fechaHasta
      ? validateDateString(fechaHasta, "fechaHasta")
      : undefined,
  };
}
