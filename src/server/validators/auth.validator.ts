import { AppError } from "@/server/utils/app-error";
import type { LoginRequestDTO, SignupRequestDTO } from "@/server/dtos/auth.dto";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function asObject(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new AppError("El cuerpo de la petición es inválido", 400);
  }

  return payload as Record<string, unknown>;
}

function getTrimmedString(payload: Record<string, unknown>, field: string) {
  const value = payload[field];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`El campo ${field} es obligatorio`, 400);
  }

  return value.trim();
}

export function validateSignupPayload(payload: unknown): SignupRequestDTO {
  const parsedPayload = asObject(payload);
  const fullName = getTrimmedString(parsedPayload, "fullName");
  const email = getTrimmedString(parsedPayload, "email").toLowerCase();
  const password = getTrimmedString(parsedPayload, "password");

  if (fullName.length < 4 || fullName.length > 120) {
    throw new AppError(
      "El nombre completo debe tener entre 4 y 120 caracteres",
      400,
    );
  }

  if (!emailRegex.test(email)) {
    throw new AppError("El email no tiene un formato válido", 400);
  }

  if (!passwordRegex.test(password)) {
    throw new AppError(
      "La contraseña debe tener mínimo 8 caracteres e incluir mayúscula, minúscula, número y símbolo",
      400,
    );
  }

  return {
    fullName,
    email,
    password,
  };
}

export function validateLoginPayload(payload: unknown): LoginRequestDTO {
  const parsedPayload = asObject(payload);
  const email = getTrimmedString(parsedPayload, "email").toLowerCase();
  const password = getTrimmedString(parsedPayload, "password");

  if (!emailRegex.test(email)) {
    throw new AppError("El email no tiene un formato válido", 400);
  }

  return { email, password };
}
