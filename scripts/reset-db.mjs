import pg from "pg";
import { applyMigrations, getDatabaseUrl, resetDatabase } from "./db-migrations.mjs";
import { loadLocalEnv } from "./load-local-env.mjs";

const { Client } = pg;

loadLocalEnv();

async function main() {
  const client = new Client({
    connectionString: getDatabaseUrl(),
  });

  await client.connect();

  try {
    await resetDatabase(client);
    await applyMigrations(client);
    console.log("Database reset and migrations reapplied.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
