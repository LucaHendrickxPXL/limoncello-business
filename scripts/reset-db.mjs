import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";
import { loadLocalEnv } from "./load-local-env.mjs";

const { Client } = pg;

loadLocalEnv();

function getDatabaseUrl() {
  const value = process.env.DATABASE_URL;

  if (!value) {
    throw new Error("DATABASE_URL is required. Copy .env.example to .env.local and fill it in.");
  }

  return value;
}

async function main() {
  const currentFile = fileURLToPath(import.meta.url);
  const rootDir = path.resolve(path.dirname(currentFile), "..");
  const schemaPath = path.join(rootDir, "schema.sql");
  const schemaSql = await fs.readFile(schemaPath, "utf8");
  const client = new Client({
    connectionString: getDatabaseUrl(),
  });

  await client.connect();

  try {
    await client.query("begin");
    await client.query("drop schema public cascade");
    await client.query("create schema public");
    await client.query(schemaSql);
    await client.query("commit");
    console.log("Database reset and schema reapplied.");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
