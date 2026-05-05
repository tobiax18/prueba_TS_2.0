type LogLevel = "info" | "warn" | "error";

function log(level: LogLevel, message: string, meta?: unknown) {
  const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;

  if (meta !== undefined) {
    console[level](prefix, meta);
    return;
  }

  console[level](prefix);
}

export const logger = {
  info: (message: string, meta?: unknown) => log("info", message, meta),
  warn: (message: string, meta?: unknown) => log("warn", message, meta),
  error: (message: string, meta?: unknown) => log("error", message, meta),
};
