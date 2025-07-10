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
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
}

export { pool, db };
export const isDatabaseAvailable = !!pool;