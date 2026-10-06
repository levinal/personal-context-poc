import { config } from 'dotenv';
import { createDatabase } from '@personal-context/db';

config({ quiet: true });
export function databaseFromEnvironment() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required. Copy .env.example to .env and start PostgreSQL.');
  return createDatabase(url);
}

export function reportError(error: unknown): void {
  // Avoid logging connection strings, query parameters, or private source content.
  const message = error instanceof Error ? error.message : 'Unknown failure';
  console.error(message.replace(/postgres(?:ql)?:\/\/[^\s]+/g, '[database URL redacted]'));
  process.exitCode = 1;
}
