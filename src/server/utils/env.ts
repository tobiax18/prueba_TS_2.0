const DEFAULT_APP_NAME = "Enterprise Reports Hub";

function getStringEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function getNumberEnv(name: string, fallback: number, min = 1) {
  const rawValue = process.env[name];

  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue) || parsedValue < min) {
    throw new Error(
      `Environment variable ${name} must be a number greater than or equal to ${min}`,
    );
  }

  return parsedValue;
}

function getBooleanEnv(name: string, fallback: boolean) {
  const rawValue = process.env[name];

  if (!rawValue) {
    return fallback;
  }

  return rawValue.toLowerCase() === "true";
}

export const env = {
  appName: getStringEnv("APP_NAME", DEFAULT_APP_NAME),
  appUrl: getStringEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
  jwtIssuer: getStringEnv("JWT_ISSUER", DEFAULT_APP_NAME),
  jwtAudience: getStringEnv("JWT_AUDIENCE", "reports-app-users"),
  jwtAccessSecret: getStringEnv("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: getStringEnv("JWT_REFRESH_SECRET"),
  jwtAccessExpiresMinutes: getNumberEnv("JWT_ACCESS_EXPIRES_MINUTES", 15),
  jwtRefreshExpiresDays: getNumberEnv("JWT_REFRESH_EXPIRES_DAYS", 7),
  reportCronEnabled: getBooleanEnv("REPORT_CRON_ENABLED", true),
  reportCronSchedule: getStringEnv("REPORT_CRON_SCHEDULE", "0 6 * * *"),
};
