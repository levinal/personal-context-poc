import { sql } from 'drizzle-orm';
import { check, index, jsonb, pgTable, real, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const sourceItems = pgTable('source_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  source: text('source').notNull(),
  sourceId: text('source_id').notNull(),
  type: text('type').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'date' }),
  content: jsonb('content').$type<unknown>().notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [uniqueIndex('source_items_source_identity').on(table.source, table.sourceId)]);

export const observations = pgTable('observations', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceItemId: uuid('source_item_id').notNull().references(() => sourceItems.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  subject: text('subject').notNull(),
  object: text('object').notNull(),
  confidence: real('confidence').notNull(),
  processor: text('processor').notNull(),
  processorVersion: text('processor_version').notNull(),
  model: text('model'),
  extractedAt: timestamp('extracted_at', { withTimezone: true, mode: 'date' }).notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [
  index('observations_source_item_index').on(table.sourceItemId),
  check('observations_confidence_range', sql`${table.confidence} >= 0 AND ${table.confidence} <= 1`),
]);
