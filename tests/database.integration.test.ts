import { randomUUID } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { eq, sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { ingest } from '@personal-context/core';
import { createDatabase, inspectDatabase, migrateDatabase, PostgresIngestionStore, schema } from '@personal-context/db';
import { LocalPhotoSource } from '@personal-context/sources';
import { MockImageProcessor } from '@personal-context/processors';
import { imageItem, syntheticPng } from './fixtures.js';

// Explicit opt-in. Only uniquely namespaced records from this run are deleted.
const url = process.env.TEST_DATABASE_URL;
describe.skipIf(!url)('PostgreSQL vertical slice', () => {
  it('migrates, ingests, preserves evidence, and is idempotent and atomic', async () => {
    const database = createDatabase(url!);
    const root = await mkdtemp(join(tmpdir(), 'context-integration-'));
    const testSource = `integration-${randomUUID()}`;
    const sourceIds: string[] = [];
    const processor = new MockImageProcessor(() => new Date('2026-01-01T00:00:00Z'));
    try {
      await migrateDatabase(database.db);
      await migrateDatabase(database.db);
      const extension = await database.db.execute(sql`SELECT extname FROM pg_extension WHERE extname = 'vector'`);
      expect(extension.rows).toHaveLength(1);
      for (const name of ['a.png', 'b.png', 'c.png']) await writeFile(join(root, name), syntheticPng);
      const local = new LocalPhotoSource(root);
      const input = { type: testSource, async *import() {
        for await (const item of local.import()) { sourceIds.push(item.id); yield { ...item, source: testSource }; }
      } };
      const store = new PostgresIngestionStore(database.db);
      expect(await ingest(input, [processor], store)).toEqual({ sourceItems: 3, observations: 3 });
      expect(await ingest(input, [processor], store)).toEqual({ sourceItems: 3, observations: 3 });
      const items = await database.db.select().from(schema.sourceItems).where(eq(schema.sourceItems.source, testSource));
      expect(items).toHaveLength(3);
      for (const item of items) {
        const values = await database.db.select().from(schema.observations).where(eq(schema.observations.sourceItemId, item.id));
        expect(values).toHaveLength(1);
        expect(values[0]).toMatchObject({ type: 'image_file', confidence: 1, processor: 'mock-image-processor', processorVersion: '1.0.0', extractedAt: new Date('2026-01-01T00:00:00Z'), metadata: { mock: true } });
      }
      const inspected = await inspectDatabase(database.db, 1000);
      expect(inspected.observations.filter((value) => value.source === testSource)).toHaveLength(3);
      expect(inspected.observations.find((value) => value.source === testSource)?.sourceId).toBeTruthy();

      const item = imageItem(testSource, sourceIds[0]!);
      const values = await processor.process(item);
      // Circular extraction metadata cannot be encoded into JSONB; the preceding upsert/delete must roll back.
      const circular: Record<string, unknown> = {};
      circular.self = circular;
      await expect(store.save({ ...item, type: 'changed-before-failure' }, values.map((value) => ({ ...value, metadata: circular })))).rejects.toThrow();
      const original = await database.db.query.sourceItems.findFirst({ where: eq(schema.sourceItems.id, items.find((value) => value.sourceId === item.id)!.id) });
      expect(original?.type).toBe('image');
      expect(await database.db.$count(schema.observations, eq(schema.observations.sourceItemId, original!.id))).toBe(1);

      // Same source ID in another adapter must be a distinct database envelope.
      await store.save(imageItem(`${testSource}-other`, item.id), await processor.process(imageItem(`${testSource}-other`, item.id)));
      expect(await database.db.$count(schema.sourceItems, eq(schema.sourceItems.source, `${testSource}-other`))).toBe(1);

      // A changed image replaces its old observation; concurrent reruns do not duplicate rows.
      const changed = { ...item, content: { ...item.content, sha256: 'b'.repeat(64) } };
      const changedValues = await processor.process(changed);
      await Promise.all([store.save(changed, changedValues), store.save(changed, changedValues)]);
      const updated = await database.db.select().from(schema.observations).where(eq(schema.observations.sourceItemId, original!.id));
      expect(updated).toHaveLength(1);
      expect(updated[0]?.metadata.sha256).toBe('b'.repeat(64));
    } finally {
      await database.db.delete(schema.sourceItems).where(eq(schema.sourceItems.source, testSource));
      await database.db.delete(schema.sourceItems).where(eq(schema.sourceItems.source, `${testSource}-other`));
      await database.close();
      await rm(root, { recursive: true, force: true });
    }
  });
});
