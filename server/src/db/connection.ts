import "dotenv/config";

export function databaseConnectionUrl(env: NodeJS.ProcessEnv = process.env): string {
  if (env.DATABASE_URL) return env.DATABASE_URL;
  if (!env.DB_HOST || !env.DB_USER || !env.DB_PASSWORD) {
    throw new Error("Set DATABASE_URL or DB_HOST, DB_USER and DB_PASSWORD.");
  }
  const url = new URL(`postgresql://${env.DB_HOST}:${env.DB_PORT || "5432"}/${env.DB_NAME || "postgres"}`);
  url.username = env.DB_USER;
  url.password = env.DB_PASSWORD;
  url.searchParams.set("sslmode", "require");
  return url.toString();
}
