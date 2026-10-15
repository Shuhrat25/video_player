import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { databaseConnectionUrl } from "./src/db/connection";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseConnectionUrl(),
  },
  strict: true,
});
