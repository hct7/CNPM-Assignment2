import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Pool } from 'pg';
import type { PoolClient } from 'pg';

export async function runMigrations() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let client: PoolClient | undefined;
  try {
    client = await pool.connect();
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
    await client.query('SELECT pg_advisory_lock(120119583)');
    const directory = join(__dirname, '../db/migrations');
    const files = (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort();
    for (const file of files) {
      const alreadyApplied = await client.query('SELECT 1 FROM schema_migrations WHERE id=$1', [file]);
      if (alreadyApplied.rowCount) continue;
      const sql = await readFile(join(directory, file), 'utf8');
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations(id) VALUES($1)', [file]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    if (client) {
      try { await client.query('SELECT pg_advisory_unlock(120119583)'); } catch { /* connection may already be broken */ }
      client.release();
    }
    await pool.end();
  }
}
