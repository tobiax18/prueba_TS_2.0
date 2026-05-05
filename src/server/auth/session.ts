import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  type SessionUser,
  verifyAccessToken,
} from "@/server/auth/jwt";

function extractBearerToken(headerValue: string | null) {
  if (!headerValue) {
    return null;
  }

  const [scheme, token] = headerValue.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

export function getAccessTokenFromRequest(request: NextRequest) {
  return (
    extractBearerToken(request.headers.get("authorization")) ??
    request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ??
    null
  );
}

export function getRefreshTokenFromRequest(request: NextRequest) {
  return request.cookies.get(REFRESH_TOKEN_COOKIE)?.value ?? null;
}

export async function getSessionFromRequest(
  request: NextRequest,
): Promise<SessionUser | null> {
  const token = getAccessTokenFromRequest(request);

  if (!token) {
    return null;
  }

  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}

export async function getServerSession() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return null;
  }

  try {
    return await verifyAccessToken(accessToken);
  } catch {
    return null;
  }
}
