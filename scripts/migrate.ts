import { migrateDatabase } from '@personal-context/db';
import { databaseFromEnvironment, reportError } from './environment.js';

async function main() {
  const database = databaseFromEnvironment();
  try {
    await migrateDatabase(database.db);
    console.log('Database migrations applied.');
  } finally {
    await database.close();
  }
}
main().catch(reportError);
