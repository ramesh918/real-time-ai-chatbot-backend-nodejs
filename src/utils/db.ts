import { Pool, PoolClient } from 'pg';
import { config } from '../config';

let pool: Pool;

export function initializePool(): Pool {
  pool = new Pool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  return pool;
}

export function getPool(): Pool {
  if (!pool) {
    initializePool();
  }
  return pool;
}

export async function query(text: string, params?: unknown[]): Promise<any> {
  const result = await getPool().query(text, params);
  return result;
}

export async function getClient(): Promise<PoolClient> {
  return getPool().connect();
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
  }
}
