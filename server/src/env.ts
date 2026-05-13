import "dotenv/config";

const required = (name: string, fallback?: string) => {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
};

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required("DATABASE_URL", "postgres://once:once@localhost:5432/once"),
  redisUrl: required("REDIS_URL", "redis://localhost:6379"),
  jwtSecret: required("JWT_SECRET", "dev-jwt"),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET", "dev-refresh"),
  encryptionKey: required("ENCRYPTION_KEY", "0".repeat(64)),
  sentryDsn: process.env.SENTRY_DSN ?? "",
  platformSandbox:
    (process.env.PLATFORM_SANDBOX ?? "true").toLowerCase() === "true",
  webhookSecrets: {
    talabat: process.env.TALABAT_WEBHOOK_SECRET ?? "dev-talabat",
    deliveroo: process.env.DELIVEROO_WEBHOOK_SECRET ?? "dev-deliveroo",
    instashop: process.env.INSTASHOP_WEBHOOK_SECRET ?? "dev-instashop",
  },
};
