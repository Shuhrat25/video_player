import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — copy .env.example to .env");
}

const client = postgres(process.env.DATABASE_URL, { max: 10 });
export const db = drizzle(client, { schema });
