import { ingest } from '@personal-context/core';
import { PostgresIngestionStore } from '@personal-context/db';
import { MockImageProcessor } from '@personal-context/processors';
import { LocalPhotoSource } from '@personal-context/sources';
import { databaseFromEnvironment, reportError } from './environment.js';

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 1) throw new Error('Usage: pnpm ingest [photo-directory]');
  const database = databaseFromEnvironment();
  try {
    const result = await ingest(new LocalPhotoSource(args[0] ?? 'sample-data/photos'), [new MockImageProcessor()], new PostgresIngestionStore(database.db));
    console.log(JSON.stringify(result, null, 2));
    if (result.sourceItems === 0) console.log('No photos found. Add photos or run pnpm demo:fixtures.');
  } finally {
    await database.close();
  }
}
main().catch(reportError);
