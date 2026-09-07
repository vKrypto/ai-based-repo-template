import { access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

async function firstExistingPath(candidates: string[]): Promise<string> {
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next runtime layout.
    }
  }

  throw new Error(`none of these paths exist: ${candidates.join(", ")}`);
}

export async function getMigrationsDir(): Promise<string> {
  return firstExistingPath([
    resolve(process.cwd(), "server/migrations"),
    resolve(process.cwd(), "migrations"),
    resolve(currentDir, "../../../migrations")
  ]);
}

export async function getDemoSeedPath(): Promise<string> {
  return firstExistingPath([
    resolve(process.cwd(), "server/seeds/demo-data.sql"),
    resolve(process.cwd(), "seeds/demo-data.sql"),
    resolve(currentDir, "../../../seeds/demo-data.sql")
  ]);
}
