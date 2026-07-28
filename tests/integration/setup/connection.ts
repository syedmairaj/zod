import { readFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import type { TestDbConfig } from "./postgres-harness";

const REPO_ROOT = path.resolve(__dirname, "../../..");
const CONNECTION_FILE = path.join(REPO_ROOT, ".tmp", "test-db-connection.json");

export function readTestDbConfig(): TestDbConfig {
  const raw = readFileSync(CONNECTION_FILE, "utf8");
  return JSON.parse(raw) as TestDbConfig;
}

export function createTestPool(): Pool {
  const config = readTestDbConfig();
  return new Pool({ host: config.host, port: config.port, user: config.user, database: config.database, max: 5 });
}
