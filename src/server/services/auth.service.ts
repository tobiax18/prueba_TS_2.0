import { Role } from "@prisma/client";

import { generateAuthTokens } from "@/server/auth/cookies";
import type { SessionUser } from "@/server/auth/jwt";
import { comparePassword, hashPassword } from "@/server/auth/password";
import { verifyRefreshToken } from "@/server/auth/jwt";
import { auditService } from "@/server/auditoria/audit.service";
import type {
  AuthResponseDTO,
  LoginRequestDTO,
  SignupRequestDTO,
} from "@/server/dtos/auth.dto";
import { authRepository } from "@/server/repositories/auth.repository";
import { hashValue } from "@/server/utils/crypto";
import { AppError } from "@/server/utils/app-error";
import { env } from "@/server/utils/env";

interface AuthContext {
  userAgent?: string;
  ipAddress?: string;
}

function mapUserToSession(user: {
  id: string;
  fullName: string;
  email: string;
  role: Role;
}): SessionUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
  };
}

async function persistRefreshToken(
  user: SessionUser,
  refreshToken: string,
  context: AuthContext,
) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.jwtRefreshExpiresDays);

  await authRepository.saveRefreshToken({
    userId: user.id,
    tokenHash: hashValue(refreshToken),
    expiresAt,
    userAgent: context.userAgent,
    ipAddress: context.ipAddress,
  });
}

async function buildAuthResponse(
  user: SessionUser,
  context: AuthContext,
): Promise<AuthResponseDTO> {
  const tokens = await generateAuthTokens(user);
  await persistRefreshToken(user, tokens.refreshToken, context);

  return {
    user,
    tokens,
  };
}

export const authService = {
  async signup(payload: SignupRequestDTO, context: AuthContext) {
    const existingUser = await authRepository.findUserByEmail(payload.email);

    if (existingUser) {
      throw new AppError("El email ya está registrado", 400);
    }

    const passwordHash = await hashPassword(payload.password);

    const user = await authRepository.createUser({
      fullName: payload.fullName,
      email: payload.email,
      passwordHash,
      role: Role.USER,
      isActive: true,
    });

    const sessionUser = mapUserToSession(user);
    const response = await buildAuthResponse(sessionUser, context);

    await auditService.logAction({
      action: "AUTH_SIGNUP",
      entity: "User",
      entityId: user.id,
      userId: user.id,
      metadata: {
        email: user.email,
        role: user.role,
      },
    });

    return response;
  },

  async login(payload: LoginRequestDTO, context: AuthContext) {
    const user = await authRepository.findUserByEmail(payload.email);

    if (!user || !user.isActive) {
      throw new AppError("Credenciales inválidas", 401);
    }

    const isValidPassword = await comparePassword(
      payload.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new AppError("Credenciales inválidas", 401);
    }

    const sessionUser = mapUserToSession(user);
    const response = await buildAuthResponse(sessionUser, context);

    await auditService.logAction({
      action: "AUTH_LOGIN",
      entity: "User",
      entityId: user.id,
      userId: user.id,
      metadata: {
        email: user.email,
      },
    });

    return response;
  },

  async refresh(refreshToken: string, context: AuthContext) {
    let payload: SessionUser;

    try {
      payload = await verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError("401 Unauthorized", 401);
    }

    const storedToken = await authRepository.findRefreshTokenByHash(
      hashValue(refreshToken),
    );

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt < new Date() ||
      !storedToken.user.isActive
    ) {
      throw new AppError("401 Unauthorized", 401);
    }

    await authRepository.revokeRefreshTokenById(storedToken.id);

    const sessionUser = mapUserToSession({
      ...payload,
      role: storedToken.user.role,
    });

    const response = await buildAuthResponse(sessionUser, context);

    await auditService.logAction({
      action: "AUTH_REFRESH_TOKEN",
      entity: "User",
      entityId: sessionUser.id,
      userId: sessionUser.id,
      metadata: {
        previousRefreshTokenId: storedToken.id,
      },
    });

    return response;
  },

  async logout(refreshToken: string | null) {
    if (!refreshToken) {
      return;
    }

    await authRepository.revokeRefreshTokenByHash(hashValue(refreshToken));
  },
};
