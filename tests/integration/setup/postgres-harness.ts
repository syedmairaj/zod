import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { Client } from "pg";

const CANDIDATE_BIN_DIRS = ["", "/opt/homebrew/bin", "/usr/local/bin", "/usr/lib/postgresql/16/bin"];

export interface TestDbConfig {
  host: string;
  port: number;
  user: string;
  database: string;
}

export interface TestPostgres {
  config: TestDbConfig;
  stop(): Promise<void>;
}

function findBinary(name: string): string {
  for (const dir of CANDIDATE_BIN_DIRS) {
    const candidate = dir ? path.join(dir, name) : name;
    const result = spawnSync(candidate, ["--version"], { stdio: "ignore" });
    if (result.status === 0) {
      return candidate;
    }
  }
  throw new Error(
    `Could not find the '${name}' binary (checked PATH and ${CANDIDATE_BIN_DIRS.filter(Boolean).join(", ")}). ` +
      "Integration tests require a local PostgreSQL installation (e.g. `brew install postgresql`).",
  );
}

function run(bin: string, args: string[]): void {
  const result = spawnSync(bin, args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${bin} ${args.join(" ")}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
  }
}

const REPO_ROOT = path.resolve(__dirname, "../../..");
const MIGRATIONS_DIR = path.join(REPO_ROOT, "packages/db/migrations");
const SHIM_SQL_PATH = path.join(__dirname, "supabase-shim.sql");

/**
 * Boots an ephemeral, disposable local PostgreSQL cluster (own data
 * directory, Unix-socket-only so there's no fixed-TCP-port collision risk),
 * applies the Supabase auth shim plus every real migration in
 * packages/db/migrations, and returns connection details for a freshly
 * created `zodai_test` database. Call `stop()` to shut down and delete the
 * cluster.
 */
export async function startTestPostgres(): Promise<TestPostgres> {
  const initdb = findBinary("initdb");
  const pgCtl = findBinary("pg_ctl");

  const runId = randomBytes(4).toString("hex");
  const dataRoot = path.join(tmpdir(), `zod-ai-test-pg-${runId}`);
  const dataDir = path.join(dataRoot, "data");
  mkdirSync(dataRoot, { recursive: true });

  run(initdb, ["-D", dataDir, "-U", "postgres", "--auth=trust", "-E", "UTF8"]);

  const port = 40000 + Math.floor(Math.random() * 10000);
  const logFile = path.join(dataRoot, "server.log");

  run(pgCtl, ["-D", dataDir, "-o", `-p ${port} -k ${dataRoot} -h ''`, "-l", logFile, "-w", "start"]);

  const config: TestDbConfig = { host: dataRoot, port, user: "postgres", database: "zodai_test" };

  const stop = async (): Promise<void> => {
    try {
      run(pgCtl, ["-D", dataDir, "-m", "fast", "stop"]);
    } finally {
      rmSync(dataRoot, { recursive: true, force: true });
    }
  };

  try {
    await applySchema(config, dataRoot, port);
  } catch (error) {
    await stop();
    throw error;
  }

  return { config, stop };
}

async function applySchema(config: TestDbConfig, socketDir: string, port: number): Promise<void> {
  await createDatabase(socketDir, port, config.database);

  const client = new Client({ host: socketDir, port, user: "postgres", database: config.database });
  await client.connect();
  try {
    await client.query(readFileSync(SHIM_SQL_PATH, "utf8"));

    const migrationFiles = [
      "0001_init.sql",
      "0002_rls.sql",
      "0003_github_onboarding_hardening.sql",
      "0004_webhook_ingestion_queue.sql",
    ];
    for (const file of migrationFiles) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      if (!existsSync(filePath)) {
        throw new Error(`Expected migration file not found: ${filePath}`);
      }
      await client.query(readFileSync(filePath, "utf8"));
    }
  } finally {
    await client.end();
  }
}

async function createDatabase(socketDir: string, port: number, database: string): Promise<void> {
  const client = new Client({ host: socketDir, port, user: "postgres", database: "postgres" });
  await client.connect();
  try {
    await client.query(`create database ${database}`);
  } finally {
    await client.end();
  }
}
