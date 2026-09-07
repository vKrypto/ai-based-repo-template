export const DEFAULT_DATABASE_URL = "postgres://barebrilliant:barebrilliant@localhost:5432/barebrilliant";

export function getDatabaseUrl(): string {
  return process.env["DATABASE_URL"] ?? DEFAULT_DATABASE_URL;
}
