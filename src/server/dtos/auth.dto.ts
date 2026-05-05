import type { Role } from "@prisma/client";

export interface SignupRequestDTO {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface SessionUserDTO {
  id: string;
  fullName: string;
  email: string;
  role: Role;
}

export interface AuthTokensDTO {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseDTO {
  user: SessionUserDTO;
  tokens: AuthTokensDTO;
}
