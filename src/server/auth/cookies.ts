import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import type {
  RequestCookies,
  ResponseCookies,
} from "next/dist/compiled/@edge-runtime/cookies";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  type SessionUser,
  signAccessToken,
  signRefreshToken,
} from "@/server/auth/jwt";
import { env } from "@/server/utils/env";

const cookieBase: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

export async function generateAuthTokens(user: SessionUser) {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(user),
    signRefreshToken(user),
  ]);

  return { accessToken, refreshToken };
}

export function setAuthCookies(
  cookiesStore: ResponseCookies,
  tokens: { accessToken: string; refreshToken: string },
) {
  cookiesStore.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...cookieBase,
    maxAge: env.jwtAccessExpiresMinutes * 60,
  });

  cookiesStore.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...cookieBase,
    maxAge: env.jwtRefreshExpiresDays * 24 * 60 * 60,
  });
}

export function clearAuthCookies(
  cookiesStore: ResponseCookies | RequestCookies,
) {
  cookiesStore.delete(ACCESS_TOKEN_COOKIE);
  cookiesStore.delete(REFRESH_TOKEN_COOKIE);
}
