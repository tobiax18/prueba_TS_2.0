import { Role } from "@prisma/client";
import { errors, jwtVerify, SignJWT } from "jose";

import { env } from "@/server/utils/env";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
}

function encodeSecret(value: string) {
  return new TextEncoder().encode(value);
}

function isRole(value: unknown): value is Role {
  return value === Role.ADMIN || value === Role.USER;
}

function mapPayload(
  payload: Record<string, unknown>,
  tokenType: "access" | "refresh",
) {
  const id = payload.sub;
  const fullName = payload.fullName;
  const email = payload.email;
  const role = payload.role;

  if (
    typeof id !== "string" ||
    typeof fullName !== "string" ||
    typeof email !== "string" ||
    !isRole(role) ||
    payload.tokenType !== tokenType
  ) {
    throw new Error("Invalid JWT payload");
  }

  return {
    id,
    fullName,
    email,
    role,
  } satisfies SessionUser;
}

async function signToken(
  user: SessionUser,
  tokenType: "access" | "refresh",
  expiresIn: string,
  secret: string,
) {
  return new SignJWT({
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    tokenType,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setIssuer(env.jwtIssuer)
    .setAudience(env.jwtAudience)
    .setExpirationTime(expiresIn)
    .sign(encodeSecret(secret));
}

export function signAccessToken(user: SessionUser) {
  return signToken(
    user,
    "access",
    `${env.jwtAccessExpiresMinutes}m`,
    env.jwtAccessSecret,
  );
}

export function signRefreshToken(user: SessionUser) {
  return signToken(
    user,
    "refresh",
    `${env.jwtRefreshExpiresDays}d`,
    env.jwtRefreshSecret,
  );
}

async function verifyToken(
  token: string,
  tokenType: "access" | "refresh",
  secret: string,
) {
  const { payload } = await jwtVerify(token, encodeSecret(secret), {
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  });

  return mapPayload(payload as Record<string, unknown>, tokenType);
}

export function verifyAccessToken(token: string) {
  return verifyToken(token, "access", env.jwtAccessSecret);
}

export function verifyRefreshToken(token: string) {
  return verifyToken(token, "refresh", env.jwtRefreshSecret);
}

export function isJwtExpiredError(error: unknown) {
  return error instanceof errors.JWTExpired;
}
