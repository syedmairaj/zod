import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { startTestPostgres, type TestPostgres } from "./postgres-harness";

const REPO_ROOT = path.resolve(__dirname, "../../..");
const CONNECTION_FILE = path.join(REPO_ROOT, ".tmp", "test-db-connection.json");

export default async function globalSetup(): Promise<() => Promise<void>> {
  const testPostgres: TestPostgres = await startTestPostgres();

  mkdirSync(path.dirname(CONNECTION_FILE), { recursive: true });
  writeFileSync(CONNECTION_FILE, JSON.stringify(testPostgres.config, null, 2));

  return async () => {
    await testPostgres.stop();
    rmSync(CONNECTION_FILE, { force: true });
  };
}

export { CONNECTION_FILE };
