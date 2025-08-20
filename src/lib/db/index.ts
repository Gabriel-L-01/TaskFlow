import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

declare global {
  // eslint-disable-next-line no-var
  var client: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var db: ReturnType<typeof drizzle> | undefined;
}

let client: ReturnType<typeof postgres>;
let db: ReturnType<typeof drizzle>;

if (process.env.NODE_ENV === 'production') {
  client = postgres(process.env.DATABASE_URL, { prepare: false });
  db = drizzle(client, { schema });
} else {
  if (!global.client) {
    global.client = postgres(process.env.DATABASE_URL, { prepare: false });
  }
  if (!global.db) {
    global.db = drizzle(global.client, { schema });
  }
  client = global.client;
  db = global.db;
}

export { db };
