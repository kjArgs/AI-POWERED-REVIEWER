import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

import { env } from "../config/env.js";
import type { Database } from './type/index.js'

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  statement_timeout: 30000,
  max: 10,
});
pool.on('error', () => console.error('Unexpected idle database connection error'));

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool,
  }),
});
