import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import { clearAuthCookies, setAuthCookies } from "@/server/auth/cookies";
import { getRefreshTokenFromRequest } from "@/server/auth/session";
import { authService } from "@/server/services/auth.service";
import { successResponse } from "@/server/utils/api-response";
import { errorToResponse } from "@/server/utils/error-handler";
import { getClientIp, getUserAgent } from "@/server/utils/request";
import {
  validateLoginPayload,
  validateSignupPayload,
} from "@/server/validators/auth.validator";

export const authController = {
  async signup(request: NextRequest) {
    try {
      const payload = validateSignupPayload(await request.json());
      const response = await authService.signup(payload, {
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      });

      const cookieStore = await cookies();
      setAuthCookies(cookieStore, response.tokens);

      return Response.json(
        successResponse(response, "Usuario registrado correctamente"),
        {
          status: 201,
        },
      );
    } catch (error) {
      return errorToResponse(error);
    }
  },

  async login(request: NextRequest) {
    try {
      const payload = validateLoginPayload(await request.json());
      const response = await authService.login(payload, {
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      });

      const cookieStore = await cookies();
      setAuthCookies(cookieStore, response.tokens);

      return Response.json(
        successResponse(response, "Inicio de sesión exitoso"),
      );
    } catch (error) {
      return errorToResponse(error);
    }
  },

  async refresh(request: NextRequest) {
    try {
      const refreshToken = getRefreshTokenFromRequest(request);

      if (!refreshToken) {
        return Response.json(
          {
            success: false,
            error: "401 Unauthorized",
            statusCode: 401,
          },
          { status: 401 },
        );
      }

      const response = await authService.refresh(refreshToken, {
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      });

      const cookieStore = await cookies();
      setAuthCookies(cookieStore, response.tokens);

      return Response.json(
        successResponse(response, "Tokens renovados correctamente"),
      );
    } catch (error) {
      return errorToResponse(error);
    }
  },

  async logout(request: NextRequest) {
    try {
      await authService.logout(getRefreshTokenFromRequest(request));
      const cookieStore = await cookies();
      clearAuthCookies(cookieStore);

      return Response.json(successResponse({}, "Sesión cerrada correctamente"));
    } catch (error) {
      return errorToResponse(error);
    }
  },
};
