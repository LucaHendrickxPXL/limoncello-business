import pg from "pg";
import { applyMigrations, getDatabaseUrl } from "./db-migrations.mjs";
import { loadLocalEnv } from "./load-local-env.mjs";

const { Client } = pg;

loadLocalEnv();

async function main() {
  const client = new Client({
    connectionString: getDatabaseUrl(),
  });

  await client.connect();

  try {
    await applyMigrations(client);
    console.log("Migrations applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
