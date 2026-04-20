import "server-only";

import { types, Pool, PoolClient, QueryResultRow } from "pg";

types.setTypeParser(1700, (value) => Number(value));

declare global {
  // eslint-disable-next-line no-var
  var __limoncelloDbPool: Pool | undefined;
}

function getDatabaseUrl() {
  const value = process.env.DATABASE_URL;

  if (!value) {
    throw new Error("DATABASE_URL ontbreekt. Maak eerst een .env.local op basis van .env.example.");
  }

  return value;
}

export function getDbPool() {
  if (!global.__limoncelloDbPool) {
    global.__limoncelloDbPool = new Pool({
      connectionString: getDatabaseUrl(),
    });
  }

  return global.__limoncelloDbPool;
}

export async function queryRows<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
) {
  const result = await getDbPool().query<T>(text, values);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
) {
  const rows = await queryRows<T>(text, values);
  return rows[0] ?? null;
}

export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>) {
  const client = await getDbPool().connect();

  try {
    await client.query("begin");
    const result = await callback(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
