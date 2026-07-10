import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres";

if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL is not set. Falling back to localhost PostgreSQL. Configure it to enable database-backed features.",
  );
}

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });
