import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import type { PoolClient } from 'pg';
import * as bcrypt from 'bcryptjs';

async function provisionManager(client: PoolClient) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email && !password) return;
  if (!email || !password) throw new Error('Set both ADMIN_EMAIL and ADMIN_PASSWORD to provision the manager account');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('ADMIN_EMAIL must be a valid email address');
  if (password.length < 16) throw new Error('ADMIN_PASSWORD must contain at least 16 characters');

  const passwordHash = await bcrypt.hash(password, 12);
  await client.query(
    `INSERT INTO users(id, name, email, password_hash, role)
     VALUES($1, 'BrewLite Manager', $2, $3, 'MANAGER')
     ON CONFLICT(email) DO UPDATE SET
       name = EXCLUDED.name,
       password_hash = EXCLUDED.password_hash,
       role = 'MANAGER'`,
    [randomUUID(), email, passwordHash],
  );
}

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
    await provisionManager(client);
  } finally {
    if (client) {
      try { await client.query('SELECT pg_advisory_unlock(120119583)'); } catch { /* connection may already be broken */ }
      client.release();
    }
    await pool.end();
  }
}
