import { AppError } from "@/server/utils/app-error";

export function parseDateInput(value: string, fieldName: string) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError(`El campo ${fieldName} debe ser una fecha válida`, 400);
  }

  return parsedDate;
}

export function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function endOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export function formatDateLabel(date: Date) {
  return date.toISOString().slice(0, 10);
}
