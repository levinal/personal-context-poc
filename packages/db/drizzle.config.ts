import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '../../.env', quiet: true });
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './migrations',
  dbCredentials: { url: process.env.DATABASE_URL ?? 'postgresql://context:context@127.0.0.1:5432/personal_context' },
});
