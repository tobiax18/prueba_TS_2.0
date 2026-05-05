import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import {
  getAccessTokenFromRequest,
  getSessionFromRequest,
} from "@/server/auth/session";
import {
  isJwtExpiredError,
  verifyAccessToken,
  type SessionUser,
} from "@/server/auth/jwt";
import { errorResponse } from "@/server/utils/api-response";
import { AppError } from "@/server/utils/app-error";

const publicApiRoutes = new Set([
  "/api/v1/auth/signup",
  "/api/v1/auth/login",
  "/api/v1/auth/refresh-token",
]);

function isProtectedApiPath(pathname: string) {
  return (
    pathname.startsWith("/api/v1/reportes") ||
    pathname.startsWith("/api/v1/dashboard") ||
    pathname.startsWith("/api/v1/users") ||
    pathname === "/api/v1/auth/logout"
  );
}

function isAdminOnlyApiPath(pathname: string, method: string) {
  if (pathname.startsWith("/api/v1/users")) {
    return true;
  }

  if (pathname === "/api/v1/reportes/scheduled") {
    return true;
  }

  if (pathname === "/api/v1/reportes" && method === "POST") {
    return true;
  }

  if (
    /^\/api\/v1\/reportes\/[^/]+$/.test(pathname) &&
    (method === "PUT" || method === "DELETE")
  ) {
    return true;
  }

  return false;
}

export function getSessionFromHeaders(
  request: NextRequest,
): SessionUser | null {
  const id = request.headers.get("x-auth-user-id");
  const fullName = request.headers.get("x-auth-user-full-name");
  const email = request.headers.get("x-auth-user-email");
  const role = request.headers.get("x-auth-user-role");

  if (!id || !fullName || !email || !role) {
    return null;
  }

  if (role !== Role.ADMIN && role !== Role.USER) {
    return null;
  }

  return {
    id,
    fullName,
    email,
    role,
  };
}

export async function requireAuthSession(request: NextRequest) {
  const session =
    getSessionFromHeaders(request) ?? (await getSessionFromRequest(request));

  if (!session) {
    throw new AppError("401 Unauthorized", 401);
  }

  return session;
}

export function requireRole(session: SessionUser, allowedRoles: Role[]) {
  if (!allowedRoles.includes(session.role)) {
    throw new AppError("403 Forbidden", 403);
  }
}

export async function authMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (publicApiRoutes.has(pathname) || !isProtectedApiPath(pathname)) {
    return NextResponse.next();
  }

  const accessToken = getAccessTokenFromRequest(request);

  if (!accessToken) {
    return NextResponse.json(errorResponse("401 Unauthorized", 401), {
      status: 401,
    });
  }

  let session: SessionUser;

  try {
    session = await verifyAccessToken(accessToken);
  } catch (error) {
    const message = isJwtExpiredError(error)
      ? "401 Unauthorized"
      : "401 Unauthorized";

    return NextResponse.json(errorResponse(message, 401), {
      status: 401,
    });
  }

  if (
    isAdminOnlyApiPath(pathname, request.method) &&
    session.role !== Role.ADMIN
  ) {
    return NextResponse.json(errorResponse("403 Forbidden", 403), {
      status: 403,
    });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-auth-user-id", session.id);
  requestHeaders.set("x-auth-user-full-name", session.fullName);
  requestHeaders.set("x-auth-user-email", session.email);
  requestHeaders.set("x-auth-user-role", session.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
