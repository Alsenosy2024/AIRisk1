import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

let pool: Pool | null = null;
let db: any = null;

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set. Using in-memory storage instead of PostgreSQL.");
} else {
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema });
    console.log("Database connection established successfully");
  } catch (error) {
    console.error("Failed to connect to database:", error);
    console.warn("Falling back to in-memory storage");
    pool = null;
    db = null;
  }
}

export { pool, db };
export const isDatabaseAvailable = !!pool;