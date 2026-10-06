import { desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { fileURLToPath } from 'node:url';
import { observationSchema, type IngestionStore, type Observation, type SourceItem } from '@personal-context/core';
import * as schema from './schema.js';

export { schema };

export function createDatabase(url: string) {
  const pool = new pg.Pool({ connectionString: url, connectionTimeoutMillis: 5_000, max: 5 });
  const db = drizzle(pool, { schema });
  return { db, close: () => pool.end() };
}
export type Database = ReturnType<typeof createDatabase>['db'];

export async function migrateDatabase(db: Database): Promise<void> {
  await migrate(db, { migrationsFolder: fileURLToPath(new URL('../migrations/', import.meta.url)) });
}

export class PostgresIngestionStore implements IngestionStore {
  constructor(private readonly db: Database) {}

  async save(item: SourceItem, values: Observation[]): Promise<void> {
    const parsed = values.map((value) => observationSchema.parse(value));
    for (const value of parsed) {
      if (value.evidence.source !== item.source || value.evidence.sourceItemId !== item.id) {
        throw new Error('Observation evidence does not match its source item');
      }
    }
    await this.db.transaction(async (tx) => {
      const envelope = {
        source: item.source,
        sourceId: item.id,
        type: item.type,
        occurredAt: item.occurredAt ?? null,
        content: item.content,
        metadata: item.metadata ?? {},
      };
      const [stored] = await tx.insert(schema.sourceItems).values(envelope)
        .onConflictDoUpdate({ target: [schema.sourceItems.source, schema.sourceItems.sourceId], set: envelope })
        .returning({ id: schema.sourceItems.id });
      if (!stored) throw new Error('Source item was not persisted');
      await tx.delete(schema.observations).where(eq(schema.observations.sourceItemId, stored.id));
      if (parsed.length > 0) {
        await tx.insert(schema.observations).values(parsed.map((value) => ({
          sourceItemId: stored.id,
          type: value.type,
          subject: value.subject,
          object: value.object,
          confidence: value.confidence,
          processor: value.processor.name,
          processorVersion: value.processor.version,
          model: value.processor.model ?? null,
          extractedAt: value.extractedAt,
          metadata: value.metadata,
        })));
      }
    });
  }
}

export async function inspectDatabase(db: Database, limit = 50) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 1000) throw new Error('Limit must be an integer from 1 to 1000');
  const totals = {
    sourceItems: await db.$count(schema.sourceItems),
    observations: await db.$count(schema.observations),
  };
  const items = await db.query.sourceItems.findMany({ orderBy: desc(schema.sourceItems.createdAt), limit });
  const evidence = await db.select({ observation: schema.observations, source: schema.sourceItems.source, sourceId: schema.sourceItems.sourceId })
    .from(schema.observations).innerJoin(schema.sourceItems, eq(schema.observations.sourceItemId, schema.sourceItems.id))
    .orderBy(desc(schema.observations.createdAt)).limit(limit);
  return { totals, sourceItems: items, observations: evidence };
}
