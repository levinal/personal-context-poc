import { inspectDatabase } from '@personal-context/db';
import { databaseFromEnvironment, reportError } from './environment.js';

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 1) throw new Error('Usage: pnpm inspect [limit: 1-1000]');
  const limit = args[0] === undefined ? 50 : Number(args[0]);
  const database = databaseFromEnvironment();
  try {
    console.log(JSON.stringify(await inspectDatabase(database.db, limit), null, 2));
  } finally {
    await database.close();
  }
}
main().catch(reportError);
