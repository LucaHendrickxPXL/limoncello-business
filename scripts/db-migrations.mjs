import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function getScriptsDir() {
  return path.dirname(fileURLToPath(import.meta.url));
}

export function getProjectRoot() {
  return path.resolve(getScriptsDir(), "..");
}

export function getDatabaseUrl() {
  const value = process.env.DATABASE_URL;

  if (!value) {
    throw new Error("DATABASE_URL is required. Copy .env.example to .env.local and fill it in.");
  }

  return value;
}

async function getMigrationFiles() {
  const migrationsDir = path.join(getProjectRoot(), "migrations");
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

const MIGRATION_LOCK_ID = 906202601;

export async function ensureMigrationsTable(client) {
  await client.query(`
    create table if not exists schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    )
  `);
}

export async function applyMigrations(client) {
  const rootDir = getProjectRoot();
  const migrationsDir = path.join(rootDir, "migrations");
  const migrationFiles = await getMigrationFiles();

  await client.query(`select pg_advisory_lock($1)`, [MIGRATION_LOCK_ID]);

  try {
    await ensureMigrationsTable(client);

    const appliedResult = await client.query(`select filename from schema_migrations`);
    const applied = new Set(appliedResult.rows.map((row) => row.filename));

    for (const filename of migrationFiles) {
      if (applied.has(filename)) {
        continue;
      }

      const migrationSql = await fs.readFile(path.join(migrationsDir, filename), "utf8");

      await client.query("begin");

      try {
        await client.query(migrationSql);
        await client.query(`insert into schema_migrations (filename) values ($1)`, [filename]);
        await client.query("commit");
        console.log(`Applied migration ${filename}.`);
      } catch (error) {
        await client.query("rollback");
        throw error;
      }
    }
  } finally {
    await client.query(`select pg_advisory_unlock($1)`, [MIGRATION_LOCK_ID]);
  }
}

export async function resetDatabase(client) {
  await client.query("begin");

  try {
    await client.query("drop schema public cascade");
    await client.query("create schema public");
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}
